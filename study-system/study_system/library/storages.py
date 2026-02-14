from storages.backends.s3 import S3Storage

class R2MP3Storage(S3Storage):
    location = "mp3"
    default_acl = None
    file_overwrite = False
