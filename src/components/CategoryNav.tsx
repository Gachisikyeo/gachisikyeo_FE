// 위치 or 판매자페이지 버튼 + 카테고리 메뉴 탭
// src/components/CategoryNav.tsx
import { FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { USER_ROLE, type User } from "../constants/userRole";

type CategoryNavProps = {
  user: User;
};

const menus = ["인기 상품", "최근 등록된 공구", "진행 중인 공구", "식품", "비식품", "의류"];

function CategoryNav({ user }: CategoryNavProps) {
  const navigate = useNavigate();

  const handleMenuClick = (menu: string) => {
    console.log(`${menu} 메뉴 클릭 (나중에 페이지 이동)`);
  };

  const isGuest = !user.isLoggedIn || user.role === USER_ROLE.GUEST;
  const isBuyer = user.isLoggedIn && user.role === USER_ROLE.BUYER;
  const isSeller = user.isLoggedIn && user.role === USER_ROLE.SELLER;

  return (
    <nav className="category-nav">
      <div className="category-nav__inner">
        <div className="category-nav__row">
          <div className="category-nav__left">
            {!isGuest && isBuyer && (
              <button type="button" className="category-nav__locationBtn">
                <FaMapMarkerAlt />
                {user.location ?? "위치 미설정"}
              </button>
            )}

            {!isGuest && isSeller && (
              <button type="button" className="category-nav__sellerBtn" onClick={() => navigate("/seller")}>
                판매자페이지
              </button>
            )}
          </div>

          <ul className="category-nav__menus">
            {menus.map((menu) => (
              <li key={menu}>
                <button type="button" onClick={() => handleMenuClick(menu)} className="category-nav__menuBtn">
                  {menu}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default CategoryNav;
