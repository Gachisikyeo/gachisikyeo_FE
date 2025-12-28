// // 로고 + 검색창 + 로그인/회원가입 or 마이페이지 버튼
// // src/components/Header.tsx
// import LogoImg from "../assets/logo2.png";
// import { FaSearch } from "react-icons/fa";
// import { LuUser, LuStore } from "react-icons/lu";
// import { useNavigate } from "react-router-dom";
// import type { AuthUser } from "../auth/authStorage";
// import { clearAuth, getAuthUser } from "../auth/authStorage";

// type Props = { user: AuthUser; onLogout: () => void };

// function Header({ user, onLogout }: Props) {
//   const navigate = useNavigate();

//   const stored = getAuthUser();
//   const effectiveUser: AuthUser = user?.isLoggedIn 
//     ? { 
//       ...stored, ...user,
//       nickName: user.nickName ?? stored.nickName,
//       lawDong: user.lawDong ?? stored.lawDong,
//     } 
//       : stored;


//   const isGuest = !effectiveUser.isLoggedIn || effectiveUser.userType === "GUEST";
//   const isSeller = effectiveUser.isLoggedIn && effectiveUser.userType === "SELLER";
//   const isBuyer = effectiveUser.isLoggedIn && effectiveUser.userType === "BUYER";

//   const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const formData = new FormData(e.currentTarget);
//     const keyword = String(formData.get("keyword") ?? "").trim();
//     console.log("search:", keyword);
//   };

//   const sellerName =
//     effectiveUser.marketName ??
//     (effectiveUser.nickName ? `${effectiveUser.nickName} 마켓` : "판매자 마켓");

//   const goMyPage = () => navigate("/mypage");

//   const handleLogoutClick = async () => {
//     clearAuth();

    
//     try {
//       await Promise.resolve(onLogout());
//     } catch (e) {
//       console.warn("logout api failed (ignored):", e);
//     }
//     window.location.replace("/");
//   };

//   return (
//     <header className="header">
//       <div className="header-top">
//         {isGuest && (
//           <div className="header-topRight">
//             <button className="header-topBtn" type="button" onClick={() => navigate("/login")}>
//               로그인
//             </button>
//             <span className="header-topDivider">/</span>
//             <button className="header-topBtn" type="button" onClick={() => navigate("/signup/email")}>
//               회원가입
//             </button>
//           </div>
//         )}

//         {isSeller && (
//           <div className="header-sellerBtn">
//             <LuStore className="header-topIcon" />
//             <span className="header-sellerName">{sellerName}</span>
//             <span className="header-topDivider">/</span>
//             <button type="button" className="header-topBtn header-logoutBtn" onClick={handleLogoutClick}>
//               로그아웃
//             </button>
//           </div>
//         )}

//         {isBuyer && (
//           <div className="header-buyerBox">
//             <button
//               type="button"
//               onClick={goMyPage}
//               className="header-topBtn"
//               style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
//               aria-label="마이페이지로 이동"
//             >
//               <LuUser className="header-topIcon" />
//               <span className="header-buyerName">{effectiveUser.nickName ?? "사용자"}</span>
//               <span className="header-buyerHonorific">님</span>
//             </button>

//             <span className="header-topDivider">/</span>
//             <button type="button" className="header-topBtn header-logoutBtn" onClick={handleLogoutClick}>
//               로그아웃
//             </button>
//           </div>
//         )}
//       </div>

//       <div className="app-layout header-inner">
//         <button className="header-logoButton" type="button" onClick={() => navigate("/")}>
//           <img src={LogoImg} alt="같이시켜" className="header-logoImage" />
//         </button>

//         <form onSubmit={handleSearchSubmit} className="header-searchWrapper">
//           <input name="keyword" placeholder="검색어를 입력해주세요." className="header-searchInput" />
//           <button className="header-searchIconBtn" type="submit" aria-label="검색">
//             <FaSearch />
//           </button>
//         </form>
//       </div>
//     </header>
//   );
// }

// export default Header;
import LogoImg from "../assets/logo2.png";
import { FaSearch } from "react-icons/fa";
import { LuUser, LuStore } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import type { AuthUser } from "../auth/authStorage";
import { getAuthUser } from "../auth/authStorage";

type Props = { user: AuthUser; onLogout: () => void };

function Header({ user, onLogout }: Props) {
  const navigate = useNavigate();

  const stored = getAuthUser();
  const effectiveUser: AuthUser = user?.isLoggedIn
    ? {
        ...stored,
        ...user,
        nickName: user.nickName ?? stored.nickName,
        lawDong: user.lawDong ?? stored.lawDong,
        marketName: user.marketName ?? stored.marketName,
      }
    : stored;

  const isGuest = !effectiveUser.isLoggedIn || effectiveUser.userType === "GUEST";
  const isSeller = effectiveUser.isLoggedIn && effectiveUser.userType === "SELLER";
  const isBuyer = effectiveUser.isLoggedIn && effectiveUser.userType === "BUYER";

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const keyword = String(formData.get("keyword") ?? "").trim();
    console.log("search:", keyword);
  };

  const sellerName =
    effectiveUser.marketName ??
    (effectiveUser.nickName ? `${effectiveUser.nickName} 마켓` : "판매자 마켓");

  const goMyPage = () => navigate("/mypage");

  const handleLogoutClick = async () => {
    try {
      await Promise.resolve(onLogout());
    } catch (e) {
      console.warn("logout api failed (ignored):", e);
    }
    window.location.replace("/");
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
            <button className="header-topBtn" type="button" onClick={() => navigate("/signup/email")}>
              회원가입
            </button>
          </div>
        )}

        {isSeller && (
          <div className="header-sellerBtn">
            <LuStore className="header-topIcon" />
            <span className="header-sellerName">{sellerName}</span>
            <span className="header-topDivider">/</span>
            <button type="button" className="header-topBtn header-logoutBtn" onClick={handleLogoutClick}>
              로그아웃
            </button>
          </div>
        )}

        {isBuyer && (
          <div className="header-buyerBox">
            <button
              type="button"
              onClick={goMyPage}
              className="header-topBtn"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              aria-label="마이페이지로 이동"
            >
              <LuUser className="header-topIcon" />
              <span className="header-buyerName">{effectiveUser.nickName ?? "사용자"}</span>
              <span className="header-buyerHonorific">님</span>
            </button>

            <span className="header-topDivider">/</span>
            <button type="button" className="header-topBtn header-logoutBtn" onClick={handleLogoutClick}>
              로그아웃
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
