-- Google Sign-In: links a user to their Google account ("sub" claim of the ID token).
ALTER TABLE "users" ADD COLUMN "google_sub" VARCHAR(255);

CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");
