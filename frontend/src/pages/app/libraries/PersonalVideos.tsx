
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MediaTabs } from '../../../components/media/MediaTabs';
import { GoogleMediaGrid } from '../../../components/media/GoogleMediaGrid';

const PersonalVideos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'local' | 'google'>('local');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'google' || tab === 'local') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'local' | 'google') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="p-8 pb-20 h-full overflow-y-auto">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Personal Videos</h1>
        <p className="text-gray-400">Your home videos collection</p>
      </div>

      <MediaTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === 'local' ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white/5 rounded-xl border border-white/10">
          <p>Local video library scanning coming soon.</p>
        </div>
      ) : (
        <GoogleMediaGrid filter="VIDEO" />
      )}
    </div>
  );
};

export default PersonalVideos;
