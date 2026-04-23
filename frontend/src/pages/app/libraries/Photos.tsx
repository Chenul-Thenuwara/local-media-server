
import { useSearchParams } from 'react-router-dom';
import { MediaTabs } from '../../../components/media/MediaTabs';
import { GoogleMediaGrid } from '../../../components/media/GoogleMediaGrid';

import { LocalPhotoGrid } from '../../../components/media/LocalPhotoGrid';

const Photos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabRaw = searchParams.get('tab');
  const activeTab = (activeTabRaw === 'google' || activeTabRaw === 'local') ? activeTabRaw : 'local';

  const handleTabChange = (tab: 'local' | 'google') => {
    setSearchParams({ tab });
  };

  return (
    <div className="p-8 pb-20 h-full overflow-y-auto">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Photos</h1>
        <p className="text-gray-400">Manage your photo collection</p>
      </div>

      <MediaTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === 'local' ? (
        <LocalPhotoGrid />
      ) : (
        <GoogleMediaGrid filter="PHOTO" />
      )}
    </div>
  );
};

export default Photos;
