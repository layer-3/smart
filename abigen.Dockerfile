FROM --platform=linux/amd64 ubuntu:latest

COPY ./Makefile .
COPY ./contracts ./contracts
RUN mkdir -p ./node_modules/@openzeppelin

RUN apt-get update -qq && apt-get install --no-install-recommends -yqq curl tar make ca-certificates
RUN curl -L https://github.com/OpenZeppelin/openzeppelin-contracts/archive/refs/tags/v4.7.3.tar.gz -o ./node_modules/openzeppelin.tar.gz
RUN tar xfz ./node_modules/openzeppelin.tar.gz --directory ./node_modules/@openzeppelin --strip-components=1 openzeppelin-contracts-4.7.3/contracts/
RUN make bindings-docker

ENTRYPOINT [ "make", "bindings-docker" ]
