export type LocalIdentity = {
  id: string;
  displayName: string;
};

const ID_KEY = "showasis_user_id";
const NAME_KEY = "showasis_display_name";

export const loadLocalIdentity = (): LocalIdentity => {
  if (typeof window === "undefined") {
    return { id: "", displayName: "" };
  }

  let id = window.localStorage.getItem(ID_KEY);
  const displayName = window.localStorage.getItem(NAME_KEY) ?? "";

  if (!id) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem(ID_KEY, id);
  }

  return { id, displayName };
};

export const saveDisplayName = (displayName: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, displayName);
};
