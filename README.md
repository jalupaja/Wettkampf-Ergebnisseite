# Wettkampf

## Password storage note

Current backend passwords are stored as bcrypt hashes, not plaintext. This is safer for normal use, but it also means admins cannot view the current password values directly from the backend.

If this project is only meant for short-term/local usage, switching to visible/plaintext passwords would be a deliberate tradeoff and should be treated as temporary only. It is not appropriate for long-term use.
