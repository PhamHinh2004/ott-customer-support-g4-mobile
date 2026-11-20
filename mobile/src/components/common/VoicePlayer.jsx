import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';

const VoicePlayer = ({ url, isOwn }) => {
  const [hasLoadedSource, setHasLoadedSource] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const player = useAudioPlayer(null, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);

  const isPlaying = Boolean(status?.playing);
  const duration = (status?.duration || 0) * 1000;
  const position = (status?.currentTime || 0) * 1000;

  useEffect(() => {
    try {
      player.pause();
    } catch {}
    setHasLoadedSource(false);
    setIsLoading(false);
    setError(null);
  }, [url, player]);

  useEffect(() => {
    if (!hasLoadedSource) return;
    if (status?.isLoaded || status?.error) {
      setIsLoading(false);
    }
    if (status?.error) {
      const msg = String(status.error);
      let errorMsg = 'Không thể phát âm thanh này';
      if (Platform.OS === 'ios' && url?.toLowerCase().endsWith('.webm')) {
        errorMsg = 'Định dạng WebM không hỗ trợ trên iOS';
      } else if (msg.includes('code -11828')) {
        errorMsg = 'Định dạng tệp không được hỗ trợ';
      } else if (msg.includes('code -1003')) {
        errorMsg = 'Lỗi kết nối máy chủ';
      }
      setError(errorMsg);
    }
  }, [hasLoadedSource, status?.isLoaded, status?.error, url]);

  const playPauseSound = async () => {
    try {
      setError(null);
      await setAudioModeAsync({
        allowsRecording: false,
        shouldPlayInBackground: true,
        playsInSilentMode: true,
      });

      if (!hasLoadedSource) {
        if (Platform.OS === 'ios' && url?.toLowerCase().endsWith('.webm')) {
          setError('Định dạng WebM không hỗ trợ trên iOS');
          return;
        }
        setIsLoading(true);
        setHasLoadedSource(true);
        player.replace(url);
        player.play();
        setIsLoading(false);
        return;
      }

      if (isPlaying) {
        player.pause();
      } else {
        if (status?.didJustFinish || (duration > 0 && position >= duration - 100)) {
          await player.seekTo(0);
        }
        player.play();
      }
    } catch (err) {
      console.error('Error playing sound detailed:', err);
      setIsLoading(false);

      let errorMsg = 'Không thể phát âm thanh này';
      if (Platform.OS === 'ios' && url?.toLowerCase().endsWith('.webm')) {
        errorMsg = 'Định dạng WebM không hỗ trợ trên iOS';
      } else if (err?.message) {
        if (err.message.includes('code -11828')) {
          errorMsg = 'Định dạng tệp không được hỗ trợ';
        } else if (err.message.includes('code -1003')) {
          errorMsg = 'Lỗi kết nối máy chủ';
        }
      }
      setError(errorMsg);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <TouchableOpacity 
        onPress={playPauseSound} 
        style={[styles.playButton, isOwn ? styles.ownPlayButton : styles.otherPlayButton]}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isOwn ? "#fff" : "#667eea"} />
        ) : (
          <MaterialIcons 
            name={isPlaying ? "pause" : "play-arrow"} 
            size={24} 
            color={isOwn ? "#fff" : "#667eea"} 
          />
        )}
      </TouchableOpacity>

      <View style={styles.progressSection}>
        <View style={styles.track}>
          <View style={[styles.progress, { width: `${progress}%` }, isOwn ? styles.ownProgress : styles.otherProgress]} />
        </View>
        <View style={styles.timeRow}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={[styles.timeText, isOwn ? styles.ownTimeText : styles.otherTimeText]}>
              {formatTime(position)} / {formatTime(duration || 0)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 0,
    minWidth: 180,
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otherPlayButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
  },
  ownPlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  progressSection: {
    flex: 1,
    marginLeft: 12,
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progress: {
    height: '100%',
    borderRadius: 1.5,
  },
  ownProgress: {
    backgroundColor: '#fff',
  },
  otherProgress: {
    backgroundColor: '#667eea',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  otherTimeText: {
    color: '#64748b',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default VoicePlayer;
