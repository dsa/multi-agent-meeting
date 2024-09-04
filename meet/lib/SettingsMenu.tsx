'use client';
import * as React from 'react';
import { LocalAudioTrack, Track } from 'livekit-client';
import {
  useMaybeLayoutContext,
  useLocalParticipant,
  MediaDeviceMenu,
  TrackToggle,
  useRoomContext,
  useIsRecording,
} from '@livekit/components-react';
import styles from '../styles/SettingsMenu.module.css';
import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';

/**
 * @alpha
 */
export interface SettingsMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * @alpha
 */
export function SettingsMenu(props: SettingsMenuProps) {
  const layoutContext = useMaybeLayoutContext();
  const room = useRoomContext();
  const recordingEndpoint = process.env.NEXT_PUBLIC_LK_RECORD_ENDPOINT;

  const settings = React.useMemo(() => {
    return {
      media: { camera: true, microphone: true, label: 'Media Devices', speaker: true },
      effects: { label: 'Effects' },
      recording: recordingEndpoint ? { label: 'Recording' } : undefined,
    };
  }, []);

  const tabs = React.useMemo(
    () => Object.keys(settings).filter((t) => t !== undefined) as Array<keyof typeof settings>,
    [settings],
  );
  const { microphoneTrack } = useLocalParticipant();

  const [activeTab, setActiveTab] = React.useState(tabs[0]);
  const [isNoiseFilterEnabled, setIsNoiseFilterEnabled] = React.useState(true);
  const [isNoiseFilterPending, setIsNoiseFilterPending] = React.useState(false);

  React.useEffect(() => {
    const micPublication = microphoneTrack;
    if (micPublication && micPublication.track instanceof LocalAudioTrack) {
      const currentProcessor = micPublication.track.getProcessor();
      if (currentProcessor && currentProcessor.name === 'livekit-noise-filter') {
        setIsNoiseFilterPending(true);
        (currentProcessor as KrispNoiseFilterProcessor)
          .setEnabled(isNoiseFilterEnabled)
          .finally(() => setIsNoiseFilterPending(false));
      } else if (!currentProcessor && isNoiseFilterEnabled) {
        setIsNoiseFilterPending(true);
        import('@livekit/krisp-noise-filter')
          .then(({ KrispNoiseFilter, isKrispNoiseFilterSupported }) => {
            if (!isKrispNoiseFilterSupported()) {
              console.error('Enhanced noise filter is not supported for this browser');
              setIsNoiseFilterEnabled(false);
              return;
            }
            micPublication?.track
              // @ts-ignore
              ?.setProcessor(KrispNoiseFilter())
              .then(() => console.log('successfully set noise filter'));
          })
          .catch((e) => console.error('Failed to load noise filter', e))
          .finally(() => setIsNoiseFilterPending(false));
      }
    }
  }, [isNoiseFilterEnabled, microphoneTrack]);

  const isRecording = useIsRecording();
  const [initialRecStatus, setInitialRecStatus] = React.useState(isRecording);
  const [processingRecRequest, setProcessingRecRequest] = React.useState(false);

  React.useEffect(() => {
    if (initialRecStatus !== isRecording) {
      setProcessingRecRequest(false);
    }
  }, [isRecording, initialRecStatus]);

  const toggleRoomRecording = async () => {
    if (!recordingEndpoint) {
      throw TypeError('No recording endpoint specified');
    }
    if (room.isE2EEEnabled) {
      throw Error('Recording of encrypted meetings is currently not supported');
    }
    setProcessingRecRequest(true);
    setInitialRecStatus(isRecording);
    let response: Response;
    if (isRecording) {
      response = await fetch(recordingEndpoint + `/stop?roomName=${room.name}`);
    } else {
      response = await fetch(recordingEndpoint + `/start?roomName=${room.name}`);
    }
    if (response.ok) {
    } else {
      console.error(
        'Error handling recording request, check server logs:',
        response.status,
        response.statusText,
      );
      setProcessingRecRequest(false);
    }
  };

  return (
    <div className="settings-menu" style={{ width: '100%' }} {...props}>
      <div className={styles.tabs}>
        {tabs.map(
          (tab) =>
            settings[tab] && (
              <button
                className={`${styles.tab} lk-button`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={tab === activeTab}
              >
                {
                  // @ts-ignore
                  settings[tab].label
                }
              </button>
            ),
        )}
      </div>
      <div className="tab-content">
        {activeTab === 'media' && (
          <>
            {settings.media && settings.media.camera && (
              <>
                <h3>Camera</h3>
                <section className="lk-button-group">
                  <TrackToggle source={Track.Source.Camera}>Camera</TrackToggle>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="videoinput" />
                  </div>
                </section>
              </>
            )}
            {settings.media && settings.media.microphone && (
              <>
                <h3>Microphone</h3>
                <section className="lk-button-group">
                  <TrackToggle source={Track.Source.Microphone}>Microphone</TrackToggle>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="audioinput" />
                  </div>
                </section>
              </>
            )}
            {settings.media && settings.media.speaker && (
              <>
                <h3>Speaker & Headphones</h3>
                <section className="lk-button-group">
                  <span className="lk-button">Audio Output</span>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="audiooutput"></MediaDeviceMenu>
                  </div>
                </section>
              </>
            )}
          </>
        )}
        {activeTab === 'effects' && (
          <>
            <h3>Audio</h3>
            <section>
              <label htmlFor="noise-filter"> Enhanced Noise Cancellation</label>
              <input
                type="checkbox"
                id="noise-filter"
                onChange={(ev) => setIsNoiseFilterEnabled(ev.target.checked)}
                checked={isNoiseFilterEnabled}
                disabled={isNoiseFilterPending}
              ></input>
            </section>
          </>
        )}
        {activeTab === 'recording' && (
          <>
            <h3>Record Meeting</h3>
            <section>
              <p>
                {isRecording
                  ? 'Meeting is currently being recorded'
                  : 'No active recordings for this meeting'}
              </p>
              <button disabled={processingRecRequest} onClick={() => toggleRoomRecording()}>
                {isRecording ? 'Stop' : 'Start'} Recording
              </button>
            </section>
          </>
        )}
      </div>
      <button
        className={`lk-button ${styles.settingsCloseButton}`}
        onClick={() => layoutContext?.widget.dispatch?.({ msg: 'toggle_settings' })}
      >
        Close
      </button>
    </div>
  );
}
