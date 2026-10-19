# ExpenseFlow REST API - Personal Expense & Budget Server

טכנולוגיות: **Node.js** | **Express** | **SQL** | **Sequelize ORM** | **JWT & bcrypt**

מסמך זה כולל את **הצעת הפרויקט המסכם** (תיאור השרת, תכנון בסיס הנתונים והקשרים, ותכנון נקודות הקצה) וכן **מדריך מלא להרצת הפרויקט מקומית (Local)**.

## 1. הגשת הרעיון הכללי

### תיאור השרת ומטרתו
שרת **ExpenseFlow** הינו RESTful API המיועד לניהול הוצאות, מעקב תקציבי וסיווג תשלומים אישי או משקי. השרת בא לפתור את בעיית חוסר השליטה בהוצאות היומיומיות, פיזור המידע הפיננסי והיעדר היכולת לפלח הוצאות לפי קטגוריות ותקציבים חודשיים. המערכת מאפשרת למשתמשים לתעד הוצאות בזמן אמת, לשייך כל הוצאה למספר קטגוריות/תגיות תקציב (Many-to-Many), לסנן לפי אמצעי תשלום או סטטוס חיוב, ולהפיק סיכומי הוצאות מדויקים.

### הקהל יעד
* **אנשים פרטיים וסטודנטים:** המעוניינים לעקוב אחר ההוצאות החודשיות שלהם ולעמוד ביעדי תקציב.
* **משקי בית וצוותים קטנים:** הנדרשים לסווג הוצאות לפי קטגוריות ותגיות מרובות (למשל: "דיור", "מזון", "לימודים", "עבודה").
* **מפתחי Frontend ומובייל:** המבקשים להתממשק למנוע ניהול הוצאות מאובטח ומוכן לעבודה דרך API תקני.

### תכונות מרכזיות (Features)
* **אימות והרשאות מאובטחים (Authentication & Authorization):** הרשמה, התחברות ואימות מבוסס JWT, לצד הצפנת סיסמאות חד-כיוונית עם `bcrypt`.
* **ניהול מלא של הוצאות (CRUD):** יצירה, צפייה, עדכון ומחיקה של הוצאות, כולל סינון וחיפוש מתקדם לפי סטטוס, אמצעי תשלום, טווח סכומים, מילת חיפוש וקטגוריה.
* **סיווג הוצאות לקטגוריות ותגיות (Many-to-Many):** שיוך גמיש של הוצאה למספר קטגוריות תקציב במקביל דרך טבלה מקשרת (`ExpenseCategories`).
* **סיכום וניתוח הוצאות (Summary Endpoint):** נקודת קצה ייעודית לחישוב סך ההוצאות שהושלמו ופילוח אוטומטי לפי אמצעי תשלום (`credit_card`, `cash`, `bank_transfer`, `digital_wallet`).
* **אבטחה ויציבות מערכתית:** הגנת Rate Limiting למניעת מתקפות Brute-Force ו-DoS, כותרות אבטחה עם `helmet`, וטיפול מרכזי בשגיאות (Error Handling Middleware) המונע קריסת שרת במקרי קצה.

## 2. תכנון בסיס הנתונים (Database Architecture)

### מבנה הטבלאות והשדות

| שם הטבלה | שם השדה (Field) | טיפוס נתונים (Data Type) | הגבלות (Constraints) |
| :--- | :--- | :--- | :--- |
| **Users** | `id` | `INTEGER` | Primary Key, Auto Increment |
| **Users** | `name` | `STRING(100)` | Not Null, Length (2–100) |
| **Users** | `email` | `STRING(150)` | Unique, IsEmail, Not Null |
| **Users** | `password` | `STRING` | Not Null (Hashed via `bcrypt`) |
| **Expenses** | `id` | `INTEGER` | Primary Key, Auto Increment |
| **Expenses** | `title` | `STRING(150)` | Not Null, Length (2–150) |
| **Expenses** | `amount` | `DECIMAL(10, 2)` | Not Null, Min (`0.01`) |
| **Expenses** | `paymentMethod` | `ENUM('credit_card', 'cash', 'bank_transfer', 'digital_wallet')` | Default: `'credit_card'` |
| **Expenses** | `status` | `ENUM('pending', 'completed', 'cancelled')` | Default: `'completed'` |
| **Expenses** | `date` | `DATEONLY` | Default: `NOW` |
| **Expenses** | `notes` | `TEXT` | Allow Null |
| **Expenses** | `userId` | `INTEGER` | Foreign Key -> `Users(id)` |
| **Categories** | `id` | `INTEGER` | Primary Key, Auto Increment |
| **Categories** | `name` | `STRING(80)` | Not Null, Length (2–80) |
| **Categories** | `monthlyBudget` | `DECIMAL(10, 2)` | Allow Null, Min (`0`) |
| **Categories** | `userId` | `INTEGER` | Foreign Key -> `Users(id)` |

### קשרים ומערכות יחסים (Sequelize Associations)

* **User <-> Expense (One-to-Many):** משתמש אחד יכול להחזיק הוצאות רבות.
  ```javascript
  User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses', onDelete: 'CASCADE' });
  Expense.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ```
* **User <-> Category (One-to-Many):** משתמש מייצר קטגוריות תקציב אישיות משלו.
  ```javascript
  User.hasMany(Category, { foreignKey: 'userId', as: 'categories', onDelete: 'CASCADE' });
  Category.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  ```
* **Expense <-> Category (Many-to-Many):** הוצאה יכולה להשתייך למספר קטגוריות, וקטגוריה יכולה להכיל הוצאות רבות (דרך טבלה מקשרת `ExpenseCategories`).
  ```javascript
  Expense.belongsToMany(Category, { through: 'ExpenseCategories', as: 'categories', foreignKey: 'expenseId' });
  Category.belongsToMany(Expense, { through: 'ExpenseCategories', as: 'expenses', foreignKey: 'categoryId' });
  ```

## 3. תכנון נקודות הקצה (API Endpoints Planning)

| Method | Endpoint | Params / Body / Query | תגובה צפויה (Success & Error) |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | **Body:** `{ name, email, password }` | **201 Created:** `{ status, user, token }`<br>**400 Bad Request:** Email exists / Validation error |
| **POST** | `/api/v1/auth/login` | **Body:** `{ email, password }` | **200 OK:** `{ status, user, token }`<br>**401 Unauthorized:** Invalid email or password |
| **GET** | `/api/v1/auth/me` | **Headers:** `Authorization: Bearer <token>` | **200 OK:** `{ status, user }`<br>**401 Unauthorized:** Missing or invalid token |
| **GET** | `/api/v1/expenses` | **Query:** `?status=completed&paymentMethod=credit_card&minAmount=20&categoryId=1&search=coffee` | **200 OK:** `{ status, count, expenses: [...] }`<br>**401 Unauthorized:** Missing or invalid token |
| **GET** | `/api/v1/expenses/summary` | **Headers:** `Authorization: Bearer <token>` | **200 OK:** `{ status, summary: { completedExpensesCount, totalCompletedAmount, breakdownByPaymentMethod } }` |
| **GET** | `/api/v1/expenses/:id` | **Params:** `id` | **200 OK:** `{ status, expense }`<br>**404 Not Found:** Expense not found |
| **POST** | `/api/v1/expenses` | **Body:** `{ title, amount, paymentMethod, status, date, notes, categoryIds }` | **201 Created:** `{ status, expense }`<br>**400 Bad Request:** Validation error |
| **PUT** | `/api/v1/expenses/:id` | **Params:** `id`<br>**Body:** `{ title, amount, status, categoryIds }` | **200 OK:** `{ status, expense }`<br>**404 Not Found:** Expense not found |
| **DELETE** | `/api/v1/expenses/:id` | **Params:** `id` | **200 OK:** `{ status, message: "Expense deleted" }`<br>**404 Not Found:** Expense not found |
| **GET** | `/api/v1/categories` | **Headers:** `Authorization: Bearer <token>` | **200 OK:** `{ status, count, categories: [...] }`<br>**401 Unauthorized:** Missing or invalid token |
| **POST** | `/api/v1/categories` | **Body:** `{ name, monthlyBudget }` | **201 Created:** `{ status, category }`<br>**400 Bad Request:** Validation or duplicate error |
| **PUT** | `/api/v1/categories/:id` | **Params:** `id`<br>**Body:** `{ name, monthlyBudget }` | **200 OK:** `{ status, category }`<br>**404 Not Found:** Category not found |
| **DELETE** | `/api/v1/categories/:id` | **Params:** `id` | **200 OK:** `{ status, message: "Category deleted" }`<br>**404 Not Found:** Category not found |

## 4. מבנה הפרויקט (MVC Architecture)

```text
expenseflow-api/
├── config/
│   └── database.js             # חיבור והגדרת Sequelize (תומך ב-SQLite וב-MySQL/PostgreSQL)
├── controllers/
│   ├── authController.js       # לוגיקת הרשמה, התחברות ושליפת פרופיל משתמש
│   ├── categoryController.js   # לוגיקת CRUD מלאה לקטגוריות תקציב
│   └── expenseController.js    # לוגיקת CRUD להוצאות, סינון, שיוך קטגוריות וסיכומים
├── middlewares/
│   ├── authMiddleware.js       # אימות JWT Token והגנה על נתיבים פרטיים
│   ├── errorHandler.js         # טיפול מרכזי בשגיאות Sequelize, JSON ושרת
│   ├── rateLimiter.js          # הגבלת קצב בקשות למניעת DoS ו-Brute-force
│   └── validateMiddleware.js   # ולידציה מוקדמת של פרמטרים וגוף הבקשה
├── models/
│   ├── index.js                # הגדרת הקשרים (One-to-Many ו-Many-to-Many)
│   ├── User.js                 # מודל משתמש + הצפנת סיסמה אוטומטית ב-Hooks
│   ├── Expense.js              # מודל הוצאה + ולידציות ORM
│   └── Category.js             # מודל קטגוריה + ולידציות ORM
├── routes/
│   ├── authRoutes.js           # נתיבי אימות (/api/v1/auth)
│   ├── categoryRoutes.js       # נתיבי קטגוריות (/api/v1/categories)
│   └── expenseRoutes.js        # נתיבי הוצאות (/api/v1/expenses)
├── .env.example                # תבנית משתני סביבה להגדרה מהירה
├── .gitignore                  # החרגת node_modules, .env וקובצי מסד נתונים מקומיים
├── app.js                      # הגדרת Express, Middlewares ונתיבים
├── server.js                   # נקודת הכניסה הראשית וסנכרון מסד הנתונים
├── package.json                # תלויות הפרויקט וסקריפטים להרצה
└── README.md                   # תיעוד הפרויקט והנחיות הרצה
```

## 5. הנחיות להרצת הפרויקט מקומית (Local Setup)

### דרישות קדם
* **Node.js** (גרסה 18 ומעלה מומלצת)
* **npm** (מותקן יחד עם Node.js)

### שלבי התקנה והרצה

1. **שכפול הפרויקט (או חילוץ תיקיית הפרויקט):**
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd expenseflow-api
   ```

2. **התקנת חבילות ותלויות:**
   ```bash
   npm install
   ```

3. **הגדרת משתני סביבה (`.env`):**
   שכפלו את קובץ הדוגמה `.env.example` לקובץ חדש בשם `.env`:
   ```bash
   cp .env.example .env
   ```
   *הערה:* כברירת מחדל הקובץ מוגדר לעבוד מול **SQLite** (`DB_DIALECT=sqlite`), כך שהפרויקט ירוץ מיד ללא צורך בהתקנת שרת MySQL חיצוני. אם תרצו לחבר אותו ל-**MySQL**, שנו בקובץ ה-`.env` את `DB_DIALECT=mysql` והזינו את פרטי החיבור (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`).

4. **הפעלת השרת:**
   * להרצה רגילה:
     ```bash
     npm start
     ```
   * להרצה במצב פיתוח (עם טעינה מחדש אוטומטית באמצעות `nodemon`):
     ```bash
     npm run dev
     ```
   השרת יעלה בכתובת `http://localhost:3000`. ניתן לבדוק את תקינותו בכתובת `GET http://localhost:3000/health`.

## 6. דוגמאות לבדיקת ה-API (Postman / Thunder Client / cURL)

### א. הרשמת משתמש חדש (`POST /api/v1/auth/register`)
```json
{
  "name": "Dani Cohen",
  "email": "dani@example.com",
  "password": "Password123!"
}
```
בתגובה תקבלו קוד `201 Created` ואת ה-`token` (JWT) שאותו יש לצרף לכותרת `Authorization: Bearer <token>` בבקשות הבאות.

### ב. יצירת קטגוריית תקציב (`POST /api/v1/categories`)
```json
{
  "name": "Groceries & Supermarket",
  "monthlyBudget": 2500
}
```

### ג. יצירת הוצאה חדשה משויכת לקטגוריות (`POST /api/v1/expenses`)
```json
{
  "title": "Weekly Supermarket Shopping",
  "amount": 420.50,
  "paymentMethod": "credit_card",
  "status": "completed",
  "date": "2026-10-17",
  "notes": "Bought vegetables, dairy, and household items",
  "categoryIds": [1]
}
```
