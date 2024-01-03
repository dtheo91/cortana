from vosk import Model, KaldiRecognizer
import json 
import sys
import wave

model = Model(model_name="vosk-model-en-us-0.22")
rec = KaldiRecognizer(model, 16000)
rec.SetWords(True)

def speech_recognition(audio_data):
    rec.AcceptWaveform(audio_data)
    result = rec.Result()
    transcript = json.loads(result)["text"]
    return transcript

if __name__ == '__main__':
    # Example usage
    with wave.open("prompt.wav", 'rb') as wav_file:
        # Read audio data
        audio_data = wav_file.readframes(wav_file.getnframes())

    result = speech_recognition(audio_data)
    print(result)