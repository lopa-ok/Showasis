export type LocalIdentity = {
  id: string;
  displayName: string;
};

export type SlackIdentity = {
    id: string;
    displayName: string;
    teamId?: string;
    teamName?: string;
    };

const SLACK_ID_KEY = "showasis_slack_user_id";
const SLACK_NAME_KEY = "showasis_slack_user_name";
const SLACK_TEAM_ID_KEY = "showasis_slack_team_id";
const SLACK_TEAM_NAME_KEY = "showasis_slack_team_name";

export const loadLocalIdentity = (): LocalIdentity => {
  if (typeof window === "undefined") {
    return { id: "", displayName: "" };
  }

  const id = window.localStorage.getItem(SLACK_ID_KEY) ?? "";
  const displayName = window.localStorage.getItem(SLACK_NAME_KEY) ?? "";

  return { id, displayName };
};

export const saveSlackIdentity = (identity: SlackIdentity) => {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.setItem(SLACK_ID_KEY, identity.id);
    window.localStorage.setItem(SLACK_NAME_KEY, identity.displayName);
    if (identity.teamId) {
        window.localStorage.setItem(SLACK_TEAM_ID_KEY, identity.teamId);
    }
    if (identity.teamName) {
        window.localStorage.setItem(SLACK_TEAM_NAME_KEY, identity.teamName);
    }
};


export const clearIdentity = () => {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.removeItem(SLACK_ID_KEY);
    window.localStorage.removeItem(SLACK_NAME_KEY);
    window.localStorage.removeItem(SLACK_TEAM_ID_KEY);
    window.localStorage.removeItem(SLACK_TEAM_NAME_KEY);
};