import { Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "@/components/layout/AuthLayout";
import MainLayout from "@/components/layout/MainLayout";

import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicOnlyRoute from "@/routes/PublicOnlyRoute";
import PermissionRoute from "@/routes/PermissionRoute";

import Login from "./pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import VerifyOtp from "@/pages/auth/VerifyOtp";
import ResetPassword from "@/pages/auth/ResetPassword";

import Dashboard from "@/pages/dashboard/Dashboard";
import Users from "@/pages/users/Users";
import Roles from "@/pages/roles/Roles";
import Permissions from "@/pages/permissions/Permissions";
import Businesses from "@/pages/businesses/Businesses";
import BusinessTypes from "@/pages/businessTypes/BusinessTypes";
import Brands from "@/pages/brands/Brand";
import Models from "@/pages/models/Model";
import Category from "./pages/category/Category";

//pos
import POS from "./pages/pos/Pos";
// import PaymentReturn from "./pages/pos/PaymentReturn";

// Sales
import CashRegister from "./pages/cashRegister/CashRegister";
import Sales from "./pages/sales/Sales";
import SalePayments from "./pages/sales/SalePayments";
import SaleItems from "./pages/sales/SaleItems";

import Customer from "./pages/customer/Customer";
import CustomerForm from "./pages/customer/CustomerForm";

import CreateManager from "./pages/users/CreateManager";
import UserDetails from "./pages/users/UserDetails";
import EditAdmin from "./pages/users/EditAdmin";
import SuperAdminOnlyRoute from "./routes/AdminOnlyRoute";
import AdminOnlyRoute from "./routes/AdminOnlyRoute";

import Product from "./pages/products/Product";
import AddProduct from "./pages/products/AddProduct";
import UpdateProduct from "./pages/products/UpdateProduct";
import ProductInventory from "./pages/productInventory/ProductInventory";

import Account from "@/pages/settings/Account";
import ThemeSettings from "@/pages/settings/ThemeSettings";

import ComingSoon from "@/pages/errors/ComingSoon";
import Forbidden from "@/pages/errors/Forbidden";
import NotFound from "@/pages/errors/NotFound";



// Routes for modules the backend doesn't expose yet — shown in the
// sidebar as "Coming Soon" and rendered as a placeholder if visited directly.
const FUTURE_ROUTES = [
  "inventory",
  "stock-transfers",
  "pos",
  "orders",
  "invoices",
  "customers",
  "suppliers",
  "reports/sales",
  "reports/inventory",
  "reports/financial",
];

export default function App() {
  return (
    <Routes>
      {/* Public-only auth routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/regist" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
      </Route>

      {/* Authenticated app */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/users"
            element={
              <PermissionRoute permission="users.read">
                <Users />
              </PermissionRoute>
            }
          />

          <Route
            path="/users/managers/create"
            element={
              <AdminOnlyRoute>
                <PermissionRoute permission="users.create">
                  <CreateManager />
                </PermissionRoute>
              </AdminOnlyRoute>
            }
          />

          {/*
            IMPORTANT:
            This route was missing — CreateManager.jsx already
            supports edit mode (via useParams id), but there was
            no route pointing "/users/managers/:id/edit" to it.
          */}
          <Route
            path="/users/managers/:id/edit"
            element={
              <AdminOnlyRoute>
                <PermissionRoute permission="users.update">
                  <CreateManager />
                </PermissionRoute>
              </AdminOnlyRoute>
            }
          />

          {/*
            Manager details page.
            Reachable by Admin (own manager) and Super Admin
            (any manager, read-only — backend enforces this).
          */}
          <Route
            path="/users/managers/:id"
            element={
              <PermissionRoute permission="users.read">
                <UserDetails />
              </PermissionRoute>
            }
          />

          {/*
            Admin details page. Super Admin only in practice —
            backend scopes what an Admin's own "/:id" call can
            return, but this route itself is just the page shell.
          */}
          <Route
            path="/users/:id"
            element={
              <PermissionRoute permission="users.read">
                <UserDetails />
              </PermissionRoute>
            }
          />

          <Route
            path="/users/:id/edit"
            element={
              <SuperAdminOnlyRoute>
                <PermissionRoute permission="users.update">
                  <EditAdmin />
                </PermissionRoute>
              </SuperAdminOnlyRoute>
            }
          />

          <Route
            path="/roles"
            element={
              <PermissionRoute permission="roles.read">
                <Roles />
              </PermissionRoute>
            }
          />
          <Route
            path="/permissions"
            element={
              <PermissionRoute permission="permissions.read">
                <Permissions />
              </PermissionRoute>
            }
          />

          <Route
            path="/businesses"
            element={
              <PermissionRoute permission="businesses.read">
                <Businesses />
              </PermissionRoute>
            }
          />
          <Route
            path="/business-types"
            element={
              <PermissionRoute permission="businesstypes.read">
                <BusinessTypes />
              </PermissionRoute>
            }
          />
          <Route
            path="/brands"
            element={
              <PermissionRoute permission="brands.read">
                <Brands />
              </PermissionRoute>
            }
          />
          <Route
            path="/models"
            element={
              <PermissionRoute permission="models.read">
                <Models />
              </PermissionRoute>
            }
          />



          <Route
            path="/categories"
            element={
              <PermissionRoute permission="categories.read">
                <Category />
              </PermissionRoute>
            }
          />

          <Route
            path="/products"
            element={

              <PermissionRoute permission="products.read">
                <Product />
              </PermissionRoute>

            }
          />

          <Route
            path="/products/create"
            element={

              <PermissionRoute permission="products.create">
                <AddProduct />
              </PermissionRoute>

            }
          />

          <Route
            path="/products/:id/edit"
            element={

              <PermissionRoute permission="products.update">
                <UpdateProduct />
              </PermissionRoute>

            }
          />

          {/* Product Details */}
          {/* <Route
            path="/products/:id"
            element={
              <PermissionRoute permission="products.read">
                <ProductDetails />
              </PermissionRoute>
            }
          /> */}

          <Route
            path="/product-inventory"
            element={
              <PermissionRoute permission="inventory.read">
                <ProductInventory />
              </PermissionRoute>
            }
          />

          {/* POS */}
          <Route
            path="/pos"
            element={
              <PermissionRoute permission="sales.create">
                <POS />
              </PermissionRoute>
            }
          />

          {/* Gateway checkout return page (PayPal / JazzCash / EasyPaisa) */}
          {/* <Route
            path="/pos/payment-return"
            element={
              <PermissionRoute permission="sales.create">
                <PaymentReturn />
              </PermissionRoute>
            }
          /> */}

          {/* Sales */}
          <Route
            path="/sales"
            element={
              <PermissionRoute permission="sales.read">
                <Sales />
              </PermissionRoute>
            }
          />

          {/* Sale Items */}
          <Route
            path="/sale-items"
            element={
              <PermissionRoute permission="sale-items.read">
                <SaleItems />
              </PermissionRoute>
            }
          />

          {/* Sale Payments */}
          <Route
            path="/sale-payments"
            element={
              <PermissionRoute permission="sale-payments.read">
                <SalePayments />
              </PermissionRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <PermissionRoute permission="customers.read">
                <Customer />
              </PermissionRoute>
            }
          />

          <Route
            path="/cash-register"
            element={
              <PermissionRoute permission="cash-registers.read">
                <CashRegister />
              </PermissionRoute>
            }
          />

          <Route path="/settings/account" element={<Account />} />
          <Route path="/settings/theme" element={<ThemeSettings />} />

          {FUTURE_ROUTES.map((path) => (
            <Route key={path} path={`/${path}`} element={<ComingSoon />} />
          ))}

          <Route path="/forbidden" element={<Forbidden />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}