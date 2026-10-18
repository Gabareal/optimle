// Minimal stand-in for glibc's <error.h>, so Selby's wordle.cpp builds on macOS.
// Used only when the platform has no <error.h> of its own (see scripts/build-solver.ts).
#pragma once
#include <cstdarg>
#include <cstdio>
#include <cstdlib>
#include <cstring>

static inline void error(int status, int errnum, const char *fmt, ...) {
  fflush(stdout);
  fprintf(stderr, "wordle: ");
  va_list ap;
  va_start(ap, fmt);
  vfprintf(stderr, fmt, ap);
  va_end(ap);
  if (errnum) fprintf(stderr, ": %s", strerror(errnum));
  fprintf(stderr, "\n");
  if (status) exit(status);
}
