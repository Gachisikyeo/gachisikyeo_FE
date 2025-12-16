// src/constants/userRole.ts
// 임시 

export const USER_ROLE = {
  GUEST: "GUEST",
  BUYER: "BUYER",
  SELLER: "SELLER",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export type User = {
  isLoggedIn: boolean;
  role: UserRole;

  nickName?: string;

  lawDongId?: number;
  addressLabel?: string;

  marketName?: string;
};

const DEV_ROLE_STORAGE_KEY = "devUserRole";

export function getNextRole(role: UserRole): UserRole {
  if (role === USER_ROLE.GUEST) return USER_ROLE.BUYER;
  if (role === USER_ROLE.BUYER) return USER_ROLE.SELLER;
  return USER_ROLE.GUEST;
}

export function createMockUser(role: UserRole): User {
  if (role === USER_ROLE.BUYER) {
    return {
      isLoggedIn: true,
      role,
      nickName: "꿀단지",
      lawDongId: 1,
      addressLabel: "오류동",
    };
  }

  if (role === USER_ROLE.SELLER) {
    return {
      isLoggedIn: true,
      role,
      nickName: "꿀단지",
      marketName: "꿀단지 마켓",
    };
  }

  return {
    isLoggedIn: false,
    role: USER_ROLE.GUEST,
  };
}

export function loadDevRole(): UserRole {
  try {
    const saved = localStorage.getItem(DEV_ROLE_STORAGE_KEY);
    if (saved === USER_ROLE.GUEST || saved === USER_ROLE.BUYER || saved === USER_ROLE.SELLER) {
      return saved;
    }
  } catch {
  }
  return USER_ROLE.GUEST;
}

export function saveDevRole(role: UserRole) {
  try {
    localStorage.setItem(DEV_ROLE_STORAGE_KEY, role);
  } catch {
  }
}
