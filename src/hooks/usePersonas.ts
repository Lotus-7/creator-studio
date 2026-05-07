import { useEffect } from "react";
import { useAppStore } from "../stores/useAppStore";
import { invoke } from "@tauri-apps/api/core";
import type { Persona } from "../types";

export const usePersonas = () => {
  const {
    personas,
    setPersonas,
    deletePersona,
  } = useAppStore();

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const data = await invoke<Persona[]>("get_personas");
      setPersonas(
        data.map((p) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }))
      );
    } catch (e) {
      console.error("Failed to load personas:", e);
      // Command might not exist yet, ignore error
    }
  };

  const savePersona = async (persona: Persona) => {
    try {
      await invoke("save_persona", { persona });
      // Reload personas after save
      await loadPersonas();
      return true;
    } catch (e) {
      console.error("Failed to save persona:", e);
      return false;
    }
  };

  const removePersona = async (id: string) => {
    try {
      await invoke("delete_persona", { id });
      deletePersona(id);
      return true;
    } catch (e) {
      console.error("Failed to delete persona:", e);
      return false;
    }
  };

  return {
    personas,
    loadPersonas,
    savePersona,
    removePersona,
  };
};
