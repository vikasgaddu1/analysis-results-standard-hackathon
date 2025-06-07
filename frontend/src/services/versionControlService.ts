import { apiClient } from './api';

export interface Version {
  id: string;
  reportingEventId: string;
  branchId: string;
  versionName: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  isCurrent: boolean;
  isTagged: boolean;
  tagName?: string;
}

export interface Branch {
  id: string;
  reportingEventId: string;
  name: string;
  description?: string;
  sourceBranchId?: string;
  sourceVersionId?: string;
  createdBy?: string;
  createdAt: string;
  isActive: boolean;
  isProtected: boolean;
  protectionRules?: {
    requireReview?: boolean;
    restrictPush?: boolean;
    requireStatusChecks?: boolean;
  };
}

export interface MergeRequest {
  id: string;
  title: string;
  description?: string;
  sourceBranchId: string;
  targetBranchId: string;
  sourceVersionId: string;
  targetVersionId: string;
  baseVersionId?: string;
  status: string;
  hasConflicts: boolean;
  conflictsData?: any;
  requiresReview: boolean;
  approvedBy?: string[];
  reviewers?: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  mergedBy?: string;
  mergedVersionId?: string;
}

export interface DiffResult {
  version1: {
    id: string;
    name: string;
    createdAt: string;
    createdBy?: string;
  };
  version2: {
    id: string;
    name: string;
    createdAt: string;
    createdBy?: string;
  };
  summary: {
    totalChanges: number;
    valuesChanged: number;
    itemsAdded: number;
    itemsRemoved: number;
    typeChanges: number;
    affectedSections: string[];
  };
  detailedChanges: any;
  statistics: any;
}

export interface HistoryEntry {
  id: string;
  action: string;
  description?: string;
  changesSummary: any;
  performedBy?: string;
  performedAt: string;
  versionId?: string;
  branchId?: string;
}

export interface ConflictResolution {
  path: string;
  resolutionType: string;
  resolvedValue: any;
  reason?: string;
}

// Version operations
export const versionControlService = {
  // Versions
  async createVersion(data: {
    reportingEventId: string;
    versionName: string;
    description?: string;
    branchName?: string;
  }): Promise<Version> {
    const response = await apiClient.post('/version-control/versions/', data);
    return response.data;
  },

  async getVersion(versionId: string): Promise<Version> {
    const response = await apiClient.get(`/version-control/versions/${versionId}`);
    return response.data;
  },

  async listVersions(params: {
    reportingEventId: string;
    branchName?: string;
    limit?: number;
  }): Promise<Version[]> {
    const response = await apiClient.get('/version-control/versions/', { params });
    return response.data;
  },

  async restoreVersion(versionId: string, createBackup = true): Promise<{ message: string; reportingEventId: string }> {
    const response = await apiClient.post(`/version-control/versions/${versionId}/restore`, { createBackup });
    return response.data;
  },

  async deleteVersion(versionId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/version-control/versions/${versionId}`);
    return response.data;
  },

  // Branches
  async createBranch(data: {
    reportingEventId: string;
    name: string;
    description?: string;
    sourceBranchName?: string;
    sourceVersionId?: string;
  }): Promise<Branch> {
    const response = await apiClient.post('/version-control/branches/', data);
    return response.data;
  },

  async listBranches(params: {
    reportingEventId: string;
    includeInactive?: boolean;
  }): Promise<Branch[]> {
    const response = await apiClient.get('/version-control/branches/', { params });
    return response.data;
  },

  async getBranchInfo(reportingEventId: string, branchName: string): Promise<any> {
    const response = await apiClient.get(`/version-control/branches/${reportingEventId}/${branchName}`);
    return response.data;
  },

  async deleteBranch(reportingEventId: string, branchName: string, force = false): Promise<{ message: string }> {
    const response = await apiClient.delete(`/version-control/branches/${reportingEventId}/${branchName}`, {
      params: { force }
    });
    return response.data;
  },

  async protectBranch(reportingEventId: string, branchName: string, protectionRules?: any): Promise<{ message: string }> {
    const response = await apiClient.post(`/version-control/branches/${reportingEventId}/${branchName}/protect`, 
      protectionRules || {}
    );
    return response.data;
  },

  async unprotectBranch(reportingEventId: string, branchName: string): Promise<{ message: string }> {
    const response = await apiClient.post(`/version-control/branches/${reportingEventId}/${branchName}/unprotect`);
    return response.data;
  },

  // Comparisons
  async compareVersions(version1Id: string, version2Id: string, includeMetadata = true): Promise<DiffResult> {
    const response = await apiClient.get(`/version-control/versions/${version1Id}/compare/${version2Id}`, {
      params: { includeMetadata }
    });
    return response.data;
  },

  async compareBranches(reportingEventId: string, branch1Name: string, branch2Name: string): Promise<any> {
    const response = await apiClient.get(`/version-control/branches/${reportingEventId}/${branch1Name}/compare/${branch2Name}`);
    return response.data;
  },

  // Merge requests
  async createMergeRequest(data: {
    title: string;
    description?: string;
    sourceBranchId: string;
    targetBranchId: string;
  }): Promise<MergeRequest> {
    const response = await apiClient.post('/version-control/merge-requests/', data);
    return response.data;
  },

  async getMergeRequest(mergeRequestId: string): Promise<MergeRequest> {
    const response = await apiClient.get(`/version-control/merge-requests/${mergeRequestId}`);
    return response.data;
  },

  async listMergeRequests(params?: {
    status?: string;
    hasConflicts?: boolean;
    createdBy?: string;
    sourceBranchId?: string;
    targetBranchId?: string;
  }): Promise<MergeRequest[]> {
    const response = await apiClient.get('/version-control/merge-requests/', { params });
    return response.data;
  },

  async autoMerge(mergeRequestId: string): Promise<{
    success: boolean;
    mergedVersionId?: string;
    messages: string[];
  }> {
    const response = await apiClient.post(`/version-control/merge-requests/${mergeRequestId}/auto-merge`);
    return response.data;
  },

  async manualMerge(mergeRequestId: string, conflictResolutions: ConflictResolution[]): Promise<{
    message: string;
    mergedVersionId: string;
  }> {
    const response = await apiClient.post(`/version-control/merge-requests/${mergeRequestId}/manual-merge`, 
      conflictResolutions
    );
    return response.data;
  },

  // Conflicts
  async getConflicts(mergeRequestId: string): Promise<any> {
    const response = await apiClient.get(`/version-control/merge-requests/${mergeRequestId}/conflicts`);
    return response.data;
  },

  async suggestConflictResolutions(conflict: any): Promise<{ suggestions: any[] }> {
    const response = await apiClient.post('/version-control/conflicts/suggest-resolutions', conflict);
    return response.data;
  },

  // Cherry-pick and revert
  async cherryPick(sourceVersionId: string, targetBranchId: string, specificChanges?: string[]): Promise<{
    message: string;
    newVersionId: string;
  }> {
    const response = await apiClient.post(`/version-control/versions/${sourceVersionId}/cherry-pick`, {
      targetBranchId,
      specificChanges
    });
    return response.data;
  },

  async revertVersion(versionId: string, targetBranchId: string): Promise<{
    message: string;
    newVersionId: string;
  }> {
    const response = await apiClient.post(`/version-control/versions/${versionId}/revert`, {
      targetBranchId
    });
    return response.data;
  },

  // History and tracking
  async getVersionLineage(versionId: string, maxDepth = 50): Promise<any> {
    const response = await apiClient.get(`/version-control/versions/${versionId}/lineage`, {
      params: { maxDepth }
    });
    return response.data;
  },

  async getChangeHistory(params: {
    reportingEventId?: string;
    branchId?: string;
    versionId?: string;
    userId?: string;
    actionType?: string;
    since?: string;
    limit?: number;
  }): Promise<HistoryEntry[]> {
    const response = await apiClient.get('/version-control/history/', { params });
    return response.data;
  },

  async getUserActivity(userId: string, since?: string, limit = 50): Promise<any> {
    const response = await apiClient.get(`/version-control/users/${userId}/activity`, {
      params: { since, limit }
    });
    return response.data;
  },

  async getBranchHistory(branchId: string, limit = 50): Promise<any[]> {
    const response = await apiClient.get(`/version-control/branches/${branchId}/history`, {
      params: { limit }
    });
    return response.data;
  },

  // Utility functions
  async getResolutionTemplates(): Promise<any> {
    const response = await apiClient.get('/version-control/templates/resolution');
    return response.data;
  },

  async createBranchFromVersion(versionId: string, newBranchName: string): Promise<{
    message: string;
    branchId: string;
    branchName: string;
  }> {
    const response = await apiClient.post(`/version-control/versions/${versionId}/branch`, {
      newBranchName
    });
    return response.data;
  },

  // Tags
  async createTag(data: {
    versionId: string;
    name: string;
    description?: string;
    tagType?: string;
    metadata?: any;
  }): Promise<any> {
    const response = await apiClient.post('/version-control/tags/', data);
    return response.data;
  },

  async listTags(versionId?: string): Promise<any[]> {
    const response = await apiClient.get('/version-control/tags/', {
      params: { versionId }
    });
    return response.data;
  },

  async deleteTag(tagId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/version-control/tags/${tagId}`);
    return response.data;
  },

  // Comments
  async createComment(data: {
    versionId: string;
    comment: string;
    commentType?: string;
    fieldPath?: string;
    lineNumber?: number;
    parentCommentId?: string;
  }): Promise<any> {
    const response = await apiClient.post('/version-control/comments/', data);
    return response.data;
  },

  async getComments(versionId: string): Promise<any[]> {
    const response = await apiClient.get('/version-control/comments/', {
      params: { versionId }
    });
    return response.data;
  },

  async updateComment(commentId: string, comment: string): Promise<any> {
    const response = await apiClient.patch(`/version-control/comments/${commentId}`, {
      comment
    });
    return response.data;
  },

  async deleteComment(commentId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/version-control/comments/${commentId}`);
    return response.data;
  },

  async resolveComment(commentId: string): Promise<any> {
    const response = await apiClient.post(`/version-control/comments/${commentId}/resolve`);
    return response.data;
  },

  // Locks
  async lockVersion(data: {
    versionId: string;
    lockReason?: string;
    expiresAt?: string;
  }): Promise<any> {
    const response = await apiClient.post('/version-control/locks/', data);
    return response.data;
  },

  async unlockVersion(lockId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/version-control/locks/${lockId}`);
    return response.data;
  },

  async getVersionLocks(versionId: string): Promise<any[]> {
    const response = await apiClient.get('/version-control/locks/', {
      params: { versionId }
    });
    return response.data;
  }
};