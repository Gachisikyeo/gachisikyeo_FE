// src/components/ProductSection.tsx
import ProductCard from './ProductCard';
import type { Product } from './ProductCard';

type ProductSectionProps = {
  title: string;
  products: Product[];
  onClickViewMore?: () => void;
};

function ProductSection({ title, products, onClickViewMore }: ProductSectionProps) {
  return (
    <section className="product-section">
      <div className="product-section__header">
        <h2 className="product-section__title">{title}</h2>
        <button
          type="button"
          onClick={onClickViewMore}
          className="product-section__moreBtn"
        >
          더보기 &gt;
        </button>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default ProductSection;
