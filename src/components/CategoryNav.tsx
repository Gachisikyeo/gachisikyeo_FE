// 위치 or 판매자페이지 버튼 + 메뉴
// src/components/CategoryNav.tsx
import { FaMapMarkerAlt } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import type { AuthUser } from "../auth/authStorage";
import { getAuthUser } from "../auth/authStorage";

type CategoryNavProps = {
  user: AuthUser;
};

const menuItems = [
  { label: "인기 상품", to: "/popular" },
  { label: "최근 등록된 상품", to: "/recent" },
  { label: "식품", to: "/category/food" },
  { label: "비식품", to: "/category/non-food" },
  { label: "의류", to: "/category/clothing" },
] as const;

function CategoryNav({ user }: CategoryNavProps) {
  const navigate = useNavigate();

  const stored = getAuthUser();
  const effectiveUser: AuthUser = user?.isLoggedIn
    ? {
        ...stored,
        ...user,
        lawDong: user.lawDong ?? stored.lawDong,
        nickName: user.nickName ?? stored.nickName,
      }
    : stored;

  const isGuest = !effectiveUser.isLoggedIn || effectiveUser.userType === "GUEST";
  const isBuyer = effectiveUser.isLoggedIn && effectiveUser.userType === "BUYER";
  const isSeller = effectiveUser.isLoggedIn && effectiveUser.userType === "SELLER";

  const addressLabel = effectiveUser.lawDong?.dong ?? "위치 미설정";

  return (
    <nav className="category-nav">
      <div className="category-nav__inner">
        <div className="category-nav__row">
          <div className="category-nav__left">
            {!isGuest && isBuyer && (
              <button type="button" className="category-nav__locationBtn">
                <FaMapMarkerAlt />
                {addressLabel}
              </button>
            )}

            {!isGuest && isSeller && (
              <button type="button" className="category-nav__sellerBtn" onClick={() => navigate("/seller")}>
                판매자페이지
              </button>
            )}
          </div>

          <ul className="category-nav__menus">
            {menuItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `category-nav__menuBtn ${isActive ? "is-active" : ""}`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default CategoryNav;
