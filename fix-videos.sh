#!/bin/bash
# Commands to make videos seekable and compatible with IOS / MacOS etc...

# Get video information
# ffprobe -hide_banner converted-h264-30s-audio-mp3.mp4

# Change container format without re-encoding. This fixes seekable problem!
# ffmpeg -i capture-h264-30s.webm -c copy -strict -2 capture-h264-30s.mp4

# Re-encode audio only and change container format
# ffmpeg -i capture-h264-30s.webm -acodec mp3 -vcodec copy capture-h264-30s-audio-mp3.mp4


