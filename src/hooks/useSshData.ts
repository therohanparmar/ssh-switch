import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { ActiveKey, AppSettings, SshKeySummary } from "../types";

type DataState = {
  settings: AppSettings | null;
  activeKey: ActiveKey | null;
  keys: SshKeySummary[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

const initialState: DataState = {
  settings: null,
  activeKey: null,
  keys: [],
  loading: true,
  refreshing: false,
  error: null
};

export const useSshData = () => {
  const [state, setState] = useState<DataState>(initialState);

  const load = async (isRefresh = false) => {
    setState((current) => ({
      ...current,
      loading: !isRefresh && current.settings === null,
      refreshing: isRefresh,
      error: null
    }));

    try {
      const [settings, activeKey, keys] = await Promise.all([
        api.getSettings(),
        api.getActiveKey(),
        api.getSshKeys()
      ]);

      setState({
        settings,
        activeKey,
        keys,
        loading: false,
        refreshing: false,
        error: null
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : "Failed to load SSH data."
      }));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return {
    ...state,
    reload: () => load(true)
  };
};
