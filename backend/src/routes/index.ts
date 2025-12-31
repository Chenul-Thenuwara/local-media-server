import authRoutes from './auth';
import libraryRoutes from './library';

const router = Router();

router.use('/auth', authRoutes);
router.use('/libraries', libraryRoutes);

router.get('/', (req, res) => {
  res.send('API Root');
});

export default router;
