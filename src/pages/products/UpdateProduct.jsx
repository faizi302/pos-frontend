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
import { getApiErrorMessage } from "@/utils/apiError";

export default function UpdateProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  // productApi transformResponse already unwraps response.data
  // so `data` IS the product document (has _id, name, ...)
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetProductByIdQuery(id, {
    skip: !id,
  });

  const [updateProduct, { isLoading: isSubmitting }] =
    useUpdateProductMutation();

  const handleSubmit = async (formData) => {
    try {
      await updateProduct({
        id,
        body: formData,
      }).unwrap();

      toast.success("Product updated successfully.");
      navigate("/products");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err) ||
          err?.data?.message ||
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

  // Product is the document itself — check _id, not data.product
  if (isError || !product?._id) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Product"
          description="Update product information."
          icon={Package}
        />
        <ErrorState
          onRetry={refetch}
          description={
            error?.data?.message ||
            getApiErrorMessage(error) ||
            "Unable to load product."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Product"
        description={`Update ${product.name || "product"} information.`}
        icon={Package}
      />

      <ProductForm
        initialValues={product}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}