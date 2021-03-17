import { act, renderHook } from "@testing-library/react-hooks";
import { ManagerMode } from "../../../components/Manager/Manager";
import { CharacterType } from "../../../domains/character/CharacterType";
import { ICharacter } from "../../../domains/character/types";
import { useCharacters } from "../CharactersContext";

describe("useCharacters", () => {
  describe("local storage load", () => {
    it("should load info from local storage", () => {
      // GIVEN
      const localStorage = new LocalStorageMock();
      localStorage.setItem("fari-characters", JSON.stringify([{ id: "hey" }]));
      // WHEN
      const { result } = renderHook(() => {
        return useCharacters({ localStorage: localStorage as any });
      });

      // THEN
      expect(result.current.state.characters).toEqual([{ id: "hey" }]);
    });
    it("should not info from local storage if empty", () => {
      // GIVEN
      const localStorage = new LocalStorageMock();
      localStorage.setItem("fari-characters", "");
      // WHEN
      const { result } = renderHook(() => {
        return useCharacters({ localStorage: localStorage as any });
      });

      // THEN
      expect(result.current.state.characters).toEqual([]);
    });
    it("should not info from local storage if empty", () => {
      // GIVEN
      const localStorage = new LocalStorageMock();
      localStorage.setItem("fari-characters", "][");
      // WHEN
      const { result } = renderHook(() => {
        return useCharacters({ localStorage: localStorage as any });
      });

      // THEN
      expect(result.current.state.characters).toEqual([]);
    });
  });
  describe("flow", () => {
    it("should be able to manager characters", () => {
      // GIVEN
      const localStorage = new LocalStorageMock();

      const { result } = renderHook(() => {
        return useCharacters({ localStorage: localStorage as any });
      });

      // WHEN I add a new character
      let newCharacter: ICharacter | undefined = undefined;
      act(() => {
        newCharacter = result.current.actions.add(CharacterType.FateCondensed);
      });
      // THEN the character is added
      expect(result.current.state.characters.length).toEqual(1);

      act(() => {
        // WHEN I update my character
        newCharacter = result.current.actions.upsert({
          ...newCharacter,
          name: "UPDATED NAME",
        } as ICharacter);
      });
      let playingCharacter: ICharacter | undefined = undefined;
      act(() => {
        // WHEN I save a character I'm already playing
        playingCharacter = result.current.actions.upsert({
          id: "an id from a live session",
        } as ICharacter);
      });

      // THEN the new character has been added and is properly sorted
      expect(result.current.state.characters[1]).toEqual(
        expect.objectContaining({
          id: playingCharacter!.id,
        })
      );
      expect(result.current.state.characters[0]).toEqual(
        expect.objectContaining({
          id: newCharacter!.id,
          lastUpdated: newCharacter!.lastUpdated,
          name: "UPDATED NAME",
        })
      );

      act(() => {
        // WHEN I remove a character
        result.current.actions.remove("an id from a live session");
      });
      // THEN the character is deleted
      expect(result.current.state.characters[0]).toEqual(
        expect.objectContaining({
          id: newCharacter!.id,
          lastUpdated: newCharacter!.lastUpdated,
          name: "UPDATED NAME",
        })
      );
      expect(result.current.state.characters[1]).toEqual(undefined);

      act(() => {
        // WHEN I add an undefined character
        result.current.actions.upsert(undefined as any);
      });
      // THEN nothing happens
      expect(result.current.state.characters[0]).toEqual(
        expect.objectContaining({
          id: newCharacter!.id,
          lastUpdated: newCharacter!.lastUpdated,
          name: "UPDATED NAME",
        })
      );

      act(() => {
        // WHEN I update an undefined character
        result.current.actions.updateIfExists(undefined as any);
      });
      // THEN nothing happens
      expect(result.current.state.characters[0]).toEqual(
        expect.objectContaining({
          id: newCharacter!.id,
          lastUpdated: newCharacter!.lastUpdated,
          name: "UPDATED NAME",
        })
      );

      act(() => {
        // WHEN I update a character that is not in the DB
        result.current.actions.updateIfExists({
          id: expect.anything(),
          name: "A NEW NAME",
        } as ICharacter);
      });
      // THEN nothing happens
      expect(result.current.state.characters.length).toEqual(1);
      expect(result.current.state.characters[0]).toEqual(
        expect.objectContaining({
          id: newCharacter!.id,
          lastUpdated: newCharacter!.lastUpdated,
          name: "UPDATED NAME",
        })
      );

      act(() => {
        // WHEN I update a character that is in the DB
        result.current.actions.updateIfExists({
          ...newCharacter,
          name: "A NEW NAME",
        } as ICharacter);
      });
      // THEN the character is updated
      expect(result.current.state.characters.length).toEqual(1);
      expect(result.current.state.characters[0]).toEqual(
        expect.objectContaining({
          id: newCharacter!.id,
          lastUpdated: newCharacter!.lastUpdated,
          name: "A NEW NAME",
        })
      );

      act(() => {
        // WHEN I open the manager
        result.current.actions.openManager(ManagerMode.Use);
      });
      // THEN the manager is opened
      expect(result.current.state.mode).toEqual(ManagerMode.Use);
      act(() => {
        // WHEN I close the manager
        result.current.actions.closeManager();
      });
      // THEN the manager is closed
      expect(result.current.state.mode).toEqual(ManagerMode.Close);
    });
  });
});

class LocalStorageMock {
  private store: Record<string, string>;
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value.toString();
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}
