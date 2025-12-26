// src/components/ProductSection.tsx
import ProductCard from "./ProductCard";
import type { Product } from "./ProductCard";

type ProductSectionProps = {
  title: string;
  products: Product[];
  onClickViewMore?: () => void;
  showMinOrderQty?: boolean;
  onClickProduct?: (product: Product) => void;
};

function ProductSection({ title, products, onClickViewMore, showMinOrderQty, onClickProduct }: ProductSectionProps) {
  return (
    <section className="product-section">
      <div className="product-section__header">
        <h2 className="product-section__title">{title}</h2>
        {onClickViewMore && (
          <button type="button" onClick={onClickViewMore} className="product-section__moreBtn">
            더보기 &gt;
          </button>
        )}
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showMinOrderQty={showMinOrderQty}
            onClick={onClickProduct ? () => onClickProduct(product) : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export default ProductSection;
