// src/components/AdBanner.tsx
import MainAdImg from '../assets/banner.png'; 

function AdBanner() {
  return (
    <section className="ad-banner">
      <div className="app-layout">
        <div className="ad-banner__imageWrapper">
          <img
            src={MainAdImg}
            alt="마켓 신규 입점 시 첫 달 판매 수수료 무료!"
            className="ad-banner__image"
          />
        </div>
      </div>
    </section>
  );
}

export default AdBanner;
