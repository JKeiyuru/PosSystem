// README.md (updated)

# Bekhal Animal Feeds POS System

A comprehensive Point of Sale system built with MERN stack for inventory management, sales tracking, and business analytics.

## Features

- 📊 **Dashboard** - Real-time business overview with sales metrics
- 🛒 **Point of Sale** - Fast and intuitive sales interface
- 📦 **Inventory Management** - Track products, stock levels, and generate barcodes
- 🔄 **Bulk Restocking** - Update multiple products simultaneously
- 👥 **Customer Management** - Track customer purchases and credit
- 📄 **Invoicing** - Generate invoices, credit notes, and debit notes
- 📈 **Reports & Analytics** - Daily sales, balance sheets, cash flow, product performance
- 📧 **Email Notifications** - Automated daily reports and low stock alerts
- 📥 **Excel Import** - Bulk import products from Excel files
- 💳 **Multiple Payment Methods** - Cash, M-Pesa, and Credit options

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer for email notifications
- Node-cron for scheduled tasks
- XLSX for Excel processing

### Frontend
- React.js with Vite
- React Router for navigation
- shadcn/ui components
- Tailwind CSS for styling
- Recharts for data visualization
- Axios for API calls

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Step 1: Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd bekhal-pos

# Install all dependencies
npm run install-all
```

### Step 2: Configure Environment Variables

**Server (.env)**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bekhal-pos
JWT_SECRET=your_jwt_secret_key_change_this_in_production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
BUSINESS_EMAIL=bekhalanimalfeeds@business.com
NODE_ENV=development
```

**Client (.env)**
```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Setup MongoDB
```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Check MongoDB status
sudo systemctl status mongod
```

### Step 4: Seed Database
```bash
# From the root directory
cd server
npm run seed
```

This will create:
- Admin user: `admin@bekhal.com` / `admin123`
- Cashier user: `cashier@bekhal.com` / `cashier123`
- 10 sample products
- 5 sample customers
- Default business settings

### Step 5: Start the Application

**Option 1: Run both servers concurrently (recommended)**
```bash
# From the root directory
npm run dev
```

**Option 2: Run servers separately**
```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

### Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## Usage

### First Time Login

1. Navigate to http://localhost:5173
2. Login with admin credentials:
   - Email: `admin@bekhal.com`
   - Password: `admin123`

### Making Your First Sale

1. Click on **POS** in the sidebar
2. Search for products or click on product cards
3. Adjust quantities as needed
4. Select payment method (Cash/M-Pesa/Credit)
5. Enter amount paid (for cash/M-Pesa)
6. Click **Complete Sale**

### Adding Products

**Method 1: Manual Entry**
1. Go to **Products** page
2. Click **Add Product**
3. Fill in product details
4. Click **Create Product**

**Method 2: Excel Import**
1. Go to **Products** page
2. Click **Import Excel**
3. Prepare your Excel file with required columns
4. Upload and import

### Bulk Restocking

1. Go to **Stock** page
2. Click **Bulk Restock**
3. Select products and enter quantities
4. Update prices if needed
5. Click **Restock Products**

### Generating Reports

1. Go to **Reports** page
2. Select date range
3. Click **Generate Reports**
4. View different report types in tabs

## Email Configuration

For email notifications to work, you need to configure SMTP settings:

### Using Gmail

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App-Specific Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password
3. Use this password in `EMAIL_PASSWORD` in `.env`

### Email Features
- Daily sales reports (sent at 6 PM by default)
- Low stock alerts
- Invoice emails to customers

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Product Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/barcode` - Generate barcode
- `POST /api/products/bulk-import` - Bulk import products

### Sale Endpoints
- `POST /api/sales` - Create sale
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale by ID
- `GET /api/sales/daily` - Get daily sales
- `PUT /api/sales/:id/payment` - Update payment

### Customer Endpoints
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Stock Endpoints
- `POST /api/stock/bulk-restock` - Bulk restock
- `POST /api/stock/adjust` - Adjust stock
- `GET /api/stock/movements` - Get stock movements
- `GET /api/stock/value` - Get stock value

### Report Endpoints
- `GET /api/reports/daily-sales` - Get daily sales report
- `GET /api/reports/balance-sheet` - Get balance sheet
- `GET /api/reports/product-performance` - Get product performance
- `GET /api/reports/cash-flow` - Get cash flow report

### Invoice Endpoints
- `POST /api/invoices` - Create invoice
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id/status` - Update invoice status
- `POST /api/invoices/from-sale/:saleId` - Create invoice from sale

## Project Structure
```
bekhal-pos/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   └── layout/   # Layout components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service files
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   └── App.jsx       # Main app component
│   └── package.json
├── server/                # Node.js backend
│   ├── controllers/      # Route controllers
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middlewares/     # Custom middlewares
│   ├── utils/           # Utility functions
│   ├── index.js         # Server entry point
│   └── package.json
├── package.json          # Root package.json
└── README.md
```

## Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod
```

### Port Already in Use
```bash
# Kill process on port 5000
sudo lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
sudo lsof -ti:5173 | xargs kill -9
```

### Email Not Sending
- Check SMTP credentials in `.env`
- Ensure 2FA is enabled for Gmail
- Use app-specific password, not regular password
- Check firewall settings

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@bekhalanimalfeeds.co.ke or create an issue in the repository.

## Acknowledgments

- shadcn/ui for beautiful UI components
- Recharts for data visualization
- The MERN stack community