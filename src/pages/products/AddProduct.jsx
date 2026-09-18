import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import toast from "react-hot-toast";

import PageHeader from "@/components/common/PageHeader";
import ProductForm from "./ProductForm";

import {
  useCreateProductMutation,
} from "@/features/products/productApi";

export default function AddProduct() {
  const navigate = useNavigate();

  const [
    createProduct,
    { isLoading: isSubmitting },
  ] = useCreateProductMutation();

  // ======================================================
  // SUBMIT
  // ======================================================
  //
  // ProductForm builds and passes a FormData instance
  // (fields + images) — we just forward it to the API.
  //
  const handleSubmit = async (formData) => {
    try {
      await createProduct(formData).unwrap();

      toast.success("Product created successfully.");

      navigate("/products");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          "Failed to create product."
      );
    }
  };

  const handleCancel = () => {
    navigate("/products");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Product"
        description="Create a new product for your business inventory."
        icon={Package}
      />

      <ProductForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}