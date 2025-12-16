// src/components/ProductCard.tsx

export type Product = {
  id: number;
  title: string;
  imageUrl: string;
  minOrderQty: number;
  singlePurchasePrice: number;
  priceFrom: number;
};

type ProductCardProps = {
  product: Product;
  onClick?: () => void;
};

function formatWon(value: number) {
  return value.toLocaleString("ko-KR");
}

function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <article className="product-card" onClick={onClick}>
      <div className="product-card__imageBox">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="product-card__image"
        />
      </div>

      <div className="product-card__titleRow">
        <div className="product-card__title">{product.title}</div>
        <span className="product-card__wishSpacer" aria-hidden />
      </div>

      <div className="product-card__market">
        구매가능 최소 수량 {product.minOrderQty}개
      </div>

      <div className="product-card__unit">
        단독 구매 시 {formatWon(product.singlePurchasePrice)}원
      </div>

      <div className="product-card__price">
        {formatWon(product.priceFrom)}원~
      </div>
    </article>
  );
}

export default ProductCard;
