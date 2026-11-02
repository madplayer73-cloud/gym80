FROM golang:1.27.3-alpine AS build
WORKDIR /src
COPY sleep/go.mod sleep/*.go ./
RUN mkdir /state && go test ./... && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /sleep .
FROM scratch
COPY --from=build /sleep /sleep
COPY --from=build --chown=65532:65532 /state /state
USER 65532:65532
ENTRYPOINT ["/sleep"]
