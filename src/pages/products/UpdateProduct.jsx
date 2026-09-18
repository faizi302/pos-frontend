import { useNavigate, useParams } from "react-router-dom";
import { Package } from "lucide-react";
import toast from "react-hot-toast";

import PageHeader from "@/components/common/PageHeader";
import ProductForm from "./ProductForm";

import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "@/features/products/productApi";

import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";

export default function UpdateProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetProductByIdQuery(
    { id },
    {
      skip: !id,
    }
  );

  const [
    updateProduct,
    { isLoading: isSubmitting },
  ] = useUpdateProductMutation();

  // ======================================================
  // SUBMIT
  // ======================================================
  //
  // ProductForm builds and passes a FormData instance
  // (fields + images) — we just forward it to the API
  // along with the product id.
  //
  const handleSubmit = async (formData) => {
    try {
      await updateProduct({
        id,
        body: formData,
      }).unwrap();

      toast.success("Product updated successfully.");

      navigate("/products");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          "Failed to update product."
      );
    }
  };

  const handleCancel = () => {
    navigate("/products");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Product"
          description="Update product information."
          icon={Package}
        />

        <TableSkeleton cols={2} />
      </div>
    );
  }

  if (isError || !data?.product) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Product"
          description="Update product information."
          icon={Package}
        />

        <ErrorState
          onRetry={refetch}
          description="Unable to load product."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Product"
        description={`Update ${data.product.name || "product"} information.`}
        icon={Package}
      />

      {/*
        ProductForm reads `initialValues` (not `product`) and
        infers edit mode from `initialValues._id` being present.
      */}
      <ProductForm
        initialValues={data.product}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}