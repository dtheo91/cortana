from elevenlabs import Voice, VoiceSettings, generate, play
from elevenlabs import set_api_key
import sys
import json

set_api_key("5fdf2db6d11c7a73be4ad872bc784ebe")

def play_sound():
    data = sys.stdin.readlines()
    response = json.loads(data[0])

    audio = generate(
        text=response,
            voice=Voice(
                voice_id = "P0edYnhQCCbHWG5n6UeC",
                settings=VoiceSettings(stability=0.5, similarity_boost=0.35, style=0.0, use_speaker_boost=True)
            ),
            model="eleven_turbo_v2"
        )

    play(audio)

if __name__ == '__main__':
    play_sound()