import { useState, useCallback, useRef } from 'react';
import { SyncField, OutputUpdate, Explanation, UndoEntry } from '../types';
import { updateExplanationField } from '../utils/api';

interface UseExplanationSyncOptions {
  explanationId?: string;
  onUpdate?: (explanation: Partial<Explanation>) => void;
}

interface UseExplanationSyncReturn {
  pendingUpdates: Map<SyncField, OutputUpdate>;
  modifiedFields: Set<SyncField>;
  undoStack: UndoEntry[];
  addPendingUpdate: (update: OutputUpdate) => void;
  syncToForm: (field: SyncField, currentValue: unknown) => Promise<void>;
  syncAllToForm: (currentValues: Partial<Explanation>) => Promise<void>;
  discardUpdate: (field: SyncField) => void;
  undoSync: (field: SyncField) => void;
  canUndo: (field: SyncField) => boolean;
  clearPendingUpdates: () => void;
}

const UNDO_TIMEOUT_MS = 30000; // 30 seconds

export function useExplanationSync(options: UseExplanationSyncOptions = {}): UseExplanationSyncReturn {
  const { explanationId, onUpdate } = options;

  const [pendingUpdates, setPendingUpdates] = useState<Map<SyncField, OutputUpdate>>(new Map());
  const [modifiedFields, setModifiedFields] = useState<Set<SyncField>>(new Set());
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);

  const undoTimeoutsRef = useRef<Map<SyncField, NodeJS.Timeout>>(new Map());

  // Add a pending update
  const addPendingUpdate = useCallback((update: OutputUpdate) => {
    setPendingUpdates((prev) => {
      const newMap = new Map(prev);
      newMap.set(update.field, { ...update, synced: false });
      return newMap;
    });
  }, []);

  // Sync a field to the form
  const syncToForm = useCallback(
    async (field: SyncField, currentValue: unknown) => {
      const update = pendingUpdates.get(field);
      if (!update) return;

      // Add to undo stack
      const undoEntry: UndoEntry = {
        field,
        previousValue: currentValue,
        timestamp: Date.now(),
      };
      setUndoStack((prev) => [...prev, undoEntry]);

      // Clear existing timeout for this field
      const existingTimeout = undoTimeoutsRef.current.get(field);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout to remove from undo stack
      const timeout = setTimeout(() => {
        setUndoStack((prev) =>
          prev.filter((entry) => !(entry.field === field && entry.timestamp === undoEntry.timestamp))
        );
        undoTimeoutsRef.current.delete(field);
      }, UNDO_TIMEOUT_MS);
      undoTimeoutsRef.current.set(field, timeout);

      // Update the explanation if we have an ID
      if (explanationId) {
        try {
          await updateExplanationField(explanationId, field, update.value);
        } catch (error) {
          console.error('Failed to update explanation field:', error);
        }
      }

      // Mark as synced
      setPendingUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(field);
        return newMap;
      });

      setModifiedFields((prev) => {
        const newSet = new Set(prev);
        newSet.add(field);
        return newSet;
      });

      // Notify parent
      if (onUpdate) {
        onUpdate({ [field]: update.value } as Partial<Explanation>);
      }
    },
    [pendingUpdates, explanationId, onUpdate]
  );

  // Sync all pending updates
  const syncAllToForm = useCallback(
    async (currentValues: Partial<Explanation>) => {
      for (const [field, update] of pendingUpdates.entries()) {
        const currentValue = currentValues[field as keyof Explanation];
        await syncToForm(field, currentValue);
      }
    },
    [pendingUpdates, syncToForm]
  );

  // Discard an update
  const discardUpdate = useCallback((field: SyncField) => {
    setPendingUpdates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(field);
      return newMap;
    });
  }, []);

  // Undo a sync
  const undoSync = useCallback(
    (field: SyncField) => {
      const entry = undoStack.find((e) => e.field === field);
      if (!entry) return;

      // Check if within timeout
      if (Date.now() - entry.timestamp > UNDO_TIMEOUT_MS) {
        // Remove expired entry
        setUndoStack((prev) => prev.filter((e) => e !== entry));
        return;
      }

      // Update the explanation with previous value
      if (explanationId) {
        updateExplanationField(explanationId, field, entry.previousValue).catch(console.error);
      }

      // Notify parent
      if (onUpdate) {
        onUpdate({ [field]: entry.previousValue } as Partial<Explanation>);
      }

      // Remove from undo stack
      setUndoStack((prev) => prev.filter((e) => e !== entry));

      // Remove from modified fields
      setModifiedFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });

      // Clear timeout
      const timeout = undoTimeoutsRef.current.get(field);
      if (timeout) {
        clearTimeout(timeout);
        undoTimeoutsRef.current.delete(field);
      }
    },
    [undoStack, explanationId, onUpdate]
  );

  // Check if can undo
  const canUndo = useCallback(
    (field: SyncField) => {
      const entry = undoStack.find((e) => e.field === field);
      if (!entry) return false;
      return Date.now() - entry.timestamp <= UNDO_TIMEOUT_MS;
    },
    [undoStack]
  );

  // Clear all pending updates
  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates(new Map());
  }, []);

  return {
    pendingUpdates,
    modifiedFields,
    undoStack,
    addPendingUpdate,
    syncToForm,
    syncAllToForm,
    discardUpdate,
    undoSync,
    canUndo,
    clearPendingUpdates,
  };
}
