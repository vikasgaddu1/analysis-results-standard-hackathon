import { useState, useCallback } from 'react';
import { 
  versionControlService, 
  Version, 
  Branch, 
  MergeRequest, 
  DiffResult, 
  HistoryEntry,
  ConflictResolution
} from '../services/versionControlService';

export const useVersionControl = (reportingEventId: string) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle async operations
  const handleAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Version operations
  const fetchVersions = useCallback(async (branchName?: string, limit = 50) => {
    return handleAsync(
      () => versionControlService.listVersions({
        reportingEventId,
        branchName,
        limit
      }),
      (result) => {
        setVersions(result);
        const current = result.find(v => v.isCurrent);
        setCurrentVersion(current || null);
      }
    );
  }, [reportingEventId, handleAsync]);

  const createVersion = useCallback(async (data: {
    reportingEventId: string;
    versionName: string;
    description?: string;
    branchName?: string;
  }) => {
    return handleAsync(
      () => versionControlService.createVersion(data),
      (result) => {
        setVersions(prev => [result, ...prev]);
        if (result.isCurrent) {
          setCurrentVersion(result);
        }
      }
    );
  }, [handleAsync]);

  const restoreVersion = useCallback(async (versionId: string, createBackup = true) => {
    return handleAsync(
      () => versionControlService.restoreVersion(versionId, createBackup)
    );
  }, [handleAsync]);

  const deleteVersion = useCallback(async (versionId: string) => {
    return handleAsync(
      () => versionControlService.deleteVersion(versionId),
      () => {
        setVersions(prev => prev.filter(v => v.id !== versionId));
        if (currentVersion?.id === versionId) {
          setCurrentVersion(null);
        }
      }
    );
  }, [handleAsync, currentVersion]);

  // Branch operations
  const fetchBranches = useCallback(async (includeInactive = false) => {
    return handleAsync(
      () => versionControlService.listBranches({
        reportingEventId,
        includeInactive
      }),
      (result) => setBranches(result)
    );
  }, [reportingEventId, handleAsync]);

  const createBranch = useCallback(async (data: {
    reportingEventId: string;
    name: string;
    description?: string;
    sourceBranchName?: string;
    sourceVersionId?: string;
  }) => {
    return handleAsync(
      () => versionControlService.createBranch(data),
      (result) => setBranches(prev => [...prev, result])
    );
  }, [handleAsync]);

  const deleteBranch = useCallback(async (branchName: string, force = false) => {
    return handleAsync(
      () => versionControlService.deleteBranch(reportingEventId, branchName, force),
      () => setBranches(prev => prev.filter(b => b.name !== branchName))
    );
  }, [reportingEventId, handleAsync]);

  const protectBranch = useCallback(async (branchName: string, protectionRules?: any) => {
    return handleAsync(
      () => versionControlService.protectBranch(reportingEventId, branchName, protectionRules),
      () => {
        setBranches(prev => prev.map(b => 
          b.name === branchName 
            ? { ...b, isProtected: true, protectionRules }
            : b
        ));
      }
    );
  }, [reportingEventId, handleAsync]);

  const unprotectBranch = useCallback(async (branchName: string) => {
    return handleAsync(
      () => versionControlService.unprotectBranch(reportingEventId, branchName),
      () => {
        setBranches(prev => prev.map(b => 
          b.name === branchName 
            ? { ...b, isProtected: false, protectionRules: undefined }
            : b
        ));
      }
    );
  }, [reportingEventId, handleAsync]);

  const getBranchInfo = useCallback(async (branchName: string) => {
    return handleAsync(
      () => versionControlService.getBranchInfo(reportingEventId, branchName)
    );
  }, [reportingEventId, handleAsync]);

  // Comparison operations
  const compareVersions = useCallback(async (version1Id: string, version2Id: string, includeMetadata = true): Promise<DiffResult | null> => {
    return handleAsync(
      () => versionControlService.compareVersions(version1Id, version2Id, includeMetadata)
    );
  }, [handleAsync]);

  const compareBranches = useCallback(async (branch1Name: string, branch2Name: string) => {
    return handleAsync(
      () => versionControlService.compareBranches(reportingEventId, branch1Name, branch2Name)
    );
  }, [reportingEventId, handleAsync]);

  // Merge request operations
  const fetchMergeRequests = useCallback(async (filters?: {
    status?: string;
    hasConflicts?: boolean;
    createdBy?: string;
    sourceBranchId?: string;
    targetBranchId?: string;
  }) => {
    return handleAsync(
      () => versionControlService.listMergeRequests(filters),
      (result) => setMergeRequests(result)
    );
  }, [handleAsync]);

  const createMergeRequest = useCallback(async (data: {
    title: string;
    description?: string;
    sourceBranchId: string;
    targetBranchId: string;
  }) => {
    return handleAsync(
      () => versionControlService.createMergeRequest(data),
      (result) => setMergeRequests(prev => [result, ...prev])
    );
  }, [handleAsync]);

  const autoMerge = useCallback(async (mergeRequestId: string) => {
    return handleAsync(
      () => versionControlService.autoMerge(mergeRequestId),
      (result) => {
        if (result.success) {
          setMergeRequests(prev => prev.map(mr => 
            mr.id === mergeRequestId 
              ? { ...mr, status: 'merged', mergedVersionId: result.mergedVersionId }
              : mr
          ));
        }
      }
    );
  }, [handleAsync]);

  const manualMerge = useCallback(async (mergeRequestId: string, conflictResolutions: ConflictResolution[]) => {
    return handleAsync(
      () => versionControlService.manualMerge(mergeRequestId, conflictResolutions),
      (result) => {
        setMergeRequests(prev => prev.map(mr => 
          mr.id === mergeRequestId 
            ? { ...mr, status: 'merged', mergedVersionId: result.mergedVersionId }
            : mr
        ));
      }
    );
  }, [handleAsync]);

  const getConflicts = useCallback(async (mergeRequestId: string) => {
    return handleAsync(
      () => versionControlService.getConflicts(mergeRequestId)
    );
  }, [handleAsync]);

  const suggestResolutions = useCallback(async (conflict: any) => {
    return handleAsync(
      () => versionControlService.suggestConflictResolutions(conflict)
    );
  }, [handleAsync]);

  // Cherry-pick and revert operations
  const cherryPick = useCallback(async (sourceVersionId: string, targetBranchId: string, specificChanges?: string[]) => {
    return handleAsync(
      () => versionControlService.cherryPick(sourceVersionId, targetBranchId, specificChanges)
    );
  }, [handleAsync]);

  const revertVersion = useCallback(async (versionId: string, targetBranchId: string) => {
    return handleAsync(
      () => versionControlService.revertVersion(versionId, targetBranchId)
    );
  }, [handleAsync]);

  // History and tracking operations
  const getVersionLineage = useCallback(async (versionId: string, maxDepth = 50) => {
    return handleAsync(
      () => versionControlService.getVersionLineage(versionId, maxDepth)
    );
  }, [handleAsync]);

  const getChangeHistory = useCallback(async (filters: {
    reportingEventId?: string;
    branchId?: string;
    versionId?: string;
    userId?: string;
    actionType?: string;
    since?: string;
    limit?: number;
  }): Promise<HistoryEntry[] | null> => {
    return handleAsync(
      () => versionControlService.getChangeHistory(filters)
    );
  }, [handleAsync]);

  const getUserActivity = useCallback(async (userId: string, since?: string, limit = 50) => {
    return handleAsync(
      () => versionControlService.getUserActivity(userId, since, limit)
    );
  }, [handleAsync]);

  const getBranchHistory = useCallback(async (branchId: string, limit = 50) => {
    return handleAsync(
      () => versionControlService.getBranchHistory(branchId, limit)
    );
  }, [handleAsync]);

  // Utility operations
  const getResolutionTemplates = useCallback(async () => {
    return handleAsync(
      () => versionControlService.getResolutionTemplates()
    );
  }, [handleAsync]);

  const createBranchFromVersion = useCallback(async (versionId: string, newBranchName: string) => {
    return handleAsync(
      () => versionControlService.createBranchFromVersion(versionId, newBranchName)
    );
  }, [handleAsync]);

  // Tag operations
  const createTag = useCallback(async (data: {
    versionId: string;
    name: string;
    description?: string;
    tagType?: string;
    metadata?: any;
  }) => {
    return handleAsync(
      () => versionControlService.createTag(data),
      () => {
        // Update the version to show it's tagged
        setVersions(prev => prev.map(v => 
          v.id === data.versionId 
            ? { ...v, isTagged: true, tagName: data.name }
            : v
        ));
      }
    );
  }, [handleAsync]);

  const listTags = useCallback(async (versionId?: string) => {
    return handleAsync(
      () => versionControlService.listTags(versionId)
    );
  }, [handleAsync]);

  const deleteTag = useCallback(async (tagId: string) => {
    return handleAsync(
      () => versionControlService.deleteTag(tagId)
    );
  }, [handleAsync]);

  // Comment operations
  const createComment = useCallback(async (data: {
    versionId: string;
    comment: string;
    commentType?: string;
    fieldPath?: string;
    lineNumber?: number;
    parentCommentId?: string;
  }) => {
    return handleAsync(
      () => versionControlService.createComment(data)
    );
  }, [handleAsync]);

  const getComments = useCallback(async (versionId: string) => {
    return handleAsync(
      () => versionControlService.getComments(versionId)
    );
  }, [handleAsync]);

  const updateComment = useCallback(async (commentId: string, comment: string) => {
    return handleAsync(
      () => versionControlService.updateComment(commentId, comment)
    );
  }, [handleAsync]);

  const deleteComment = useCallback(async (commentId: string) => {
    return handleAsync(
      () => versionControlService.deleteComment(commentId)
    );
  }, [handleAsync]);

  const resolveComment = useCallback(async (commentId: string) => {
    return handleAsync(
      () => versionControlService.resolveComment(commentId)
    );
  }, [handleAsync]);

  // Lock operations
  const lockVersion = useCallback(async (data: {
    versionId: string;
    lockReason?: string;
    expiresAt?: string;
  }) => {
    return handleAsync(
      () => versionControlService.lockVersion(data)
    );
  }, [handleAsync]);

  const unlockVersion = useCallback(async (lockId: string) => {
    return handleAsync(
      () => versionControlService.unlockVersion(lockId)
    );
  }, [handleAsync]);

  const getVersionLocks = useCallback(async (versionId: string) => {
    return handleAsync(
      () => versionControlService.getVersionLocks(versionId)
    );
  }, [handleAsync]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchBranches(),
      fetchVersions(),
      fetchMergeRequests()
    ]);
  }, [fetchBranches, fetchVersions, fetchMergeRequests]);

  return {
    // State
    versions,
    branches,
    mergeRequests,
    currentVersion,
    loading,
    error,

    // Version operations
    fetchVersions,
    createVersion,
    restoreVersion,
    deleteVersion,

    // Branch operations
    fetchBranches,
    createBranch,
    deleteBranch,
    protectBranch,
    unprotectBranch,
    getBranchInfo,

    // Comparison operations
    compareVersions,
    compareBranches,

    // Merge request operations
    fetchMergeRequests,
    createMergeRequest,
    autoMerge,
    manualMerge,
    getConflicts,
    suggestResolutions,

    // Cherry-pick and revert operations
    cherryPick,
    revertVersion,

    // History and tracking operations
    getVersionLineage,
    getChangeHistory,
    getUserActivity,
    getBranchHistory,

    // Utility operations
    getResolutionTemplates,
    createBranchFromVersion,

    // Tag operations
    createTag,
    listTags,
    deleteTag,

    // Comment operations
    createComment,
    getComments,
    updateComment,
    deleteComment,
    resolveComment,

    // Lock operations
    lockVersion,
    unlockVersion,
    getVersionLocks,

    // Utility functions
    clearError,
    refresh
  };
};