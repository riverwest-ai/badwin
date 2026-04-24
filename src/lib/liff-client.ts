import liff from "@line/liff";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

let initialized = false;

export async function initLiff() {
  if (initialized) return;
  await liff.init({ liffId: LIFF_ID });
  initialized = true;
}

export async function getLiffProfile() {
  await initLiff();
  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }
  return liff.getProfile();
}

export function isInLiff() {
  return liff.isInClient();
}

export { liff };
