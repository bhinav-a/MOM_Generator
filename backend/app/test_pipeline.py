from speech_to_text import convert_audio_to_text
from mom_generator import generate_mom

audio_path = r"D:\2026\Projects\MOM Generator\Testing Audio\audio1.mp3"

transcript = convert_audio_to_text(audio_path)
print("\n--- TRANSCRIPT ---\n")
print(transcript)

mom = generate_mom(transcript)
print("\n--- MOM ---\n")
print(mom)
