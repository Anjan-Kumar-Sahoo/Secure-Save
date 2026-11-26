import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/user-model';
import { authenticateToken } from '../middleware/auth-middleware';
import { validationErrorHandler } from '../../../utils/error-handler';

const router = Router();

/**
 * GET /api/auth/vault-keys
 * Returns the user's wrapped DEK configuration
 */
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: {
        hasVaultKey: !!user.vaultKeyConfiguration?.wrappedDek,
        vaultKeyConfiguration: user.vaultKeyConfiguration || null,
      }
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/vault-keys
 * Setup or update wrapped DEK
 */
router.post(
  '/',
  authenticateToken,
  [
    body('kekSalt').isString().notEmpty().withMessage('kekSalt is required'),
    body('wrappedDek').isString().notEmpty().withMessage('wrappedDek is required'),
    body('keyVersion').optional().isInt({ min: 1 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(validationErrorHandler(errors.array()));
      }

      const userId = (req as any).userId;
      const {
        kekSalt,
        wrappedDek,
        keyVersion = 2,
        iterations = 600000,
        kdfAlgorithm = 'PBKDF2-SHA256',
        recoveryWrappedDek,
        recoverySalt,
      } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.vaultKeyConfiguration = {
        kdfAlgorithm,
        kekSalt,
        wrappedDek,
        keyVersion,
        iterations,
        recoveryWrappedDek: recoveryWrappedDek || user.vaultKeyConfiguration?.recoveryWrappedDek,
        recoverySalt: recoverySalt || user.vaultKeyConfiguration?.recoverySalt,
        createdAt: user.vaultKeyConfiguration?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      user.encryptionKeyVersion = keyVersion;
      await user.save();

      return res.json({
        success: true,
        message: 'Vault key configuration saved successfully',
        data: {
          keyVersion,
          updatedAt: user.vaultKeyConfiguration.updatedAt,
        }
      });
    } catch (error) {
      return next(error);
    }
  }
);

export { router as vaultKeyRoutes };
