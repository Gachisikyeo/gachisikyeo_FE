// // 로고 + 검색창 + 로그인/회원가입 or 마이페이지 버튼
import LogoImg from "../assets/logo.png";
import { FaSearch } from "react-icons/fa";

import { LuUser, LuStore } from "react-icons/lu";

import { useNavigate } from "react-router-dom";
import { USER_ROLE, type User } from "../constants/userRole";

type Props = { user: User };

function Header({ user }: Props) {
  const navigate = useNavigate();

  const isGuest = !user.isLoggedIn || user.role === USER_ROLE.GUEST;
  const isSeller = user.isLoggedIn && user.role === USER_ROLE.SELLER;
  const isBuyer = user.isLoggedIn && user.role === USER_ROLE.BUYER;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const keyword = String(formData.get("keyword") ?? "").trim();
    console.log("search:", keyword);
  };

  return (
    <header className="header">
      <div className="header-top">
        {isGuest && (
          <div className="header-topRight">
            <button className="header-topBtn" type="button" onClick={() => navigate("/login")}>
              로그인
            </button>
            <span className="header-topDivider">/</span>
            <button className="header-topBtn" type="button" onClick={() => navigate("/signup")}>
              회원가입
            </button>
          </div>
        )}

        {isSeller && (
          <button type="button" className="header-sellerBtn" onClick={() => navigate("/seller")}>
            <LuStore className="header-topIcon" />
            <span className="header-sellerName">{user.marketName ?? "판매자 마켓"}</span>
          </button>
        )}

        {isBuyer && (
          <div className="header-buyerBox">
            <LuUser className="header-topIcon" />
            <span className="header-buyerName">{user.nickname ?? "사용자"}</span>
            <span className="header-buyerHonorific">님</span>

            <span className="header-buyerDivider">/</span>
            <button type="button" className="header-myPageBtn" onClick={() => navigate("/mypage")}>
              마이페이지
            </button>
          </div>
        )}
      </div>

      <div className="app-layout header-inner">
        <button className="header-logoButton" type="button" onClick={() => navigate("/")}>
          <img src={LogoImg} alt="같이시켜" className="header-logoImage" />
        </button>

        <form onSubmit={handleSearchSubmit} className="header-searchWrapper">
          <input name="keyword" placeholder="검색어를 입력해주세요." className="header-searchInput" />
          <button className="header-searchIconBtn" type="submit" aria-label="검색">
            <FaSearch />
          </button>
        </form>
      </div>
    </header>
  );
}

export default Header;
