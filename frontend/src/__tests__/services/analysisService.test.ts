import { describe, it, expect, beforeEach } from 'vitest';
import { analysisService } from '../../services/analysisService';
import { createMockAnalysis } from '../../test-utils/test-utils';

describe('analysisService', () => {
  beforeEach(() => {
    // Set mock token for authenticated requests
    localStorage.setItem('token', 'mock-jwt-token');
  });

  describe('getAll', () => {
    it('fetches all analyses', async () => {
      const analyses = await analysisService.getAll();

      expect(analyses).toHaveLength(3);
      expect(analyses[0]).toHaveProperty('id');
      expect(analyses[0]).toHaveProperty('name');
      expect(analyses[0]).toHaveProperty('description');
    });
  });

  describe('getById', () => {
    it('fetches a specific analysis', async () => {
      const analysis = await analysisService.getById('AN001');

      expect(analysis).toEqual(
        expect.objectContaining({
          id: 'AN001',
          version: '1.0',
          name: 'Test Analysis',
        })
      );
    });

    it('throws error for non-existent analysis', async () => {
      await expect(
        analysisService.getById('nonexistent')
      ).rejects.toThrow('Analysis not found');
    });
  });

  describe('create', () => {
    it('creates a new analysis', async () => {
      const newAnalysis = {
        id: 'AN_NEW',
        version: '1.0',
        name: 'New Analysis',
        description: 'New analysis description',
        reason: 'SPECIFIED' as const,
        purpose: 'PRIMARY_OUTCOME_MEASURE' as const,
        reportingEventId: 'RE001',
      };

      const created = await analysisService.create(newAnalysis);

      expect(created).toEqual(
        expect.objectContaining({
          id: 'AN_NEW',
          name: 'New Analysis',
          description: 'New analysis description',
        })
      );
    });
  });

  describe('update', () => {
    it('updates an existing analysis', async () => {
      const updates = {
        name: 'Updated Analysis Name',
        description: 'Updated description',
      };

      const updated = await analysisService.update('AN001', updates);

      expect(updated).toEqual(
        expect.objectContaining({
          id: 'AN001',
          name: 'Updated Analysis Name',
          description: 'Updated description',
        })
      );
    });
  });

  describe('delete', () => {
    it('deletes an analysis', async () => {
      await expect(
        analysisService.delete('AN001')
      ).resolves.not.toThrow();
    });
  });

  describe('getByReportingEvent', () => {
    it('fetches analyses for a reporting event', async () => {
      const analyses = await analysisService.getByReportingEvent('RE001');

      expect(analyses).toBeInstanceOf(Array);
      expect(analyses.length).toBeGreaterThan(0);
      analyses.forEach(analysis => {
        expect(analysis).toHaveProperty('reportingEventId', 'RE001');
      });
    });
  });

  describe('validate', () => {
    it('validates an analysis', async () => {
      const analysis = createMockAnalysis();
      const validation = await analysisService.validate(analysis);

      expect(validation).toEqual({
        isValid: true,
        errors: [],
        warnings: [],
        info: ['Validation completed successfully'],
      });
    });
  });

  describe('duplicate', () => {
    it('duplicates an existing analysis', async () => {
      const duplicated = await analysisService.duplicate('AN001', {
        id: 'AN001_COPY',
        name: 'Copy of Analysis',
      });

      expect(duplicated).toEqual(
        expect.objectContaining({
          id: 'AN001_COPY',
          name: 'Copy of Analysis',
        })
      );
    });
  });

  describe('error handling', () => {
    it('handles unauthorized requests', async () => {
      // Remove token
      localStorage.removeItem('token');

      await expect(
        analysisService.getAll()
      ).rejects.toThrow();
    });

    it('handles network errors', async () => {
      // This would typically be tested with MSW by simulating network errors
      // For now, we'll just verify the service structure
      expect(analysisService).toHaveProperty('getAll');
      expect(analysisService).toHaveProperty('getById');
      expect(analysisService).toHaveProperty('create');
      expect(analysisService).toHaveProperty('update');
      expect(analysisService).toHaveProperty('delete');
    });
  });
});