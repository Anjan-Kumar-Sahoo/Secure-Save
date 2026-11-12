import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';

export const AddAudio = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [isRecording, setIsRecording] = React.useState(false);
  const [audioChunks, setAudioChunks] = React.useState<Blob[]>([]);
  const [duration, setDuration] = React.useState(0);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      setIsRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setDuration(0);
        setIsRecording(false);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

      // Update duration every second
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      setTimeout(() => clearInterval(interval), 60000); // Max 60 seconds
    } catch (error) {
      console.error('Recording failed:', error);
    }
  };

  const handleStopRecording = () => {
    const activeMediaRecorder = document.querySelector('media-recorder');
    if (activeMediaRecorder) {
      (activeMediaRecorder as any).stop();
    }
    setIsRecording(false);
  };

  const handleUpload = () => {
    console.log('Audio recorded, duration:', duration, 'seconds');
    navigate('/collections');
  };

  return (
    <div className="app-shell min-h-screen flex-1 p-6 text-[#F5F7FA]">
      <div className="max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Audio</h2>
          <p className="text-[#929BAA]">
            Record a voice note or upload an audio file.
          </p>
        </div>

        {!isRecording ? (
          <div>
            <button
              onClick={handleStartRecording}
              className="w-full btn-primary py-3 rounded-xl"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
              Record Voice Note
            </button>
          </div>) : (
          <div className="space-y-4">
            <button onClick={handleStopRecording} className="text-red-500">
              Stop Recording
            </button>
            <div className="flex items-center justify-between">
              <span className="text-sm">Duration: {duration}s</span>
              <button
                onClick={handleUpload}
                className="text-[#8B7CFF] hover:underline text-sm"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/collections')}
          className="w-full btn-primary py-3 rounded-xl mt-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};