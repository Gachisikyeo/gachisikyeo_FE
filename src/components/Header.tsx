// // 로고 + 검색창 + 로그인/회원가입 or 마이페이지 버튼
// // src/components/Header.tsx
// import LogoImg from "../assets/logo.png";
// import { FaSearch } from "react-icons/fa";
// import { LuUser, LuStore } from "react-icons/lu";
// import { useNavigate } from "react-router-dom";
// import type { AuthUser } from "../auth/authStorage";

// type Props = { user: AuthUser; onLogout: () => void };

// function Header({ user, onLogout }: Props) {
//   const navigate = useNavigate();

//   const isGuest = !user.isLoggedIn || user.userType === "GUEST";
//   const isSeller = user.isLoggedIn && user.userType === "SELLER";
//   const isBuyer = user.isLoggedIn && user.userType === "BUYER";

//   const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const formData = new FormData(e.currentTarget);
//     const keyword = String(formData.get("keyword") ?? "").trim();
//     console.log("search:", keyword);
//   };

//   const sellerName = user.marketName ?? (user.nickName ? `${user.nickName} 마켓` : "판매자 마켓");

//   const goMyPage = () => navigate("/mypage");

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
//             <button type="button" className="header-topBtn header-logoutBtn" onClick={onLogout}>
//               로그아웃
//             </button>
//           </div>
//         )}

//         {isBuyer && (
//           <div className="header-buyerBox">
//             {/* ✅ 여기만 클릭하면 마이페이지로 */}
//             <button
//               type="button"
//               onClick={goMyPage}
//               className="header-topBtn"
//               style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
//               aria-label="마이페이지로 이동"
//             >
//               <LuUser className="header-topIcon" />
//               <span className="header-buyerName">{user.nickName ?? "사용자"}</span>
//               <span className="header-buyerHonorific">님</span>
//             </button>

//             <span className="header-topDivider">/</span>
//             <button type="button" className="header-topBtn header-logoutBtn" onClick={onLogout}>
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
// src/components/Header.tsx
import LogoImg from "../assets/logo.png";
import { FaSearch } from "react-icons/fa";
import { LuUser, LuStore } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import type { AuthUser } from "../auth/authStorage";
import { clearAuth, getAuthUser } from "../auth/authStorage";

type Props = { user: AuthUser; onLogout: () => void };

function Header({ user, onLogout }: Props) {
  const navigate = useNavigate();

  // ✅ props user가 stale(GUEST)로 들어오는 케이스가 있어서,
  // localStorage의 authUser를 fallback으로 사용
  const effectiveUser: AuthUser = user?.isLoggedIn ? user : getAuthUser();

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
    // ✅ 1) 서버가 500이어도 프론트는 무조건 로그아웃 상태가 되어야 함
    clearAuth();

    // ✅ 2) 서버 로그아웃은 best-effort (실패해도 무시)
    try {
      await Promise.resolve(onLogout());
    } catch (e) {
      console.warn("logout api failed (ignored):", e);
    }

    // ✅ 3) 페이지들에서 getAuthUser()를 useMemo로 고정해둔 경우가 많아서
    // 강제 새로고침이 제일 확실함
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
