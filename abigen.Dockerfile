FROM ubuntu:latest
WORKDIR /build

COPY ./Makefile .
RUN apt-get update -qq && apt-get install --no-install-recommends -yqq curl make && make fetch-abigen

ENTRYPOINT [ "make", "abigen" ]
