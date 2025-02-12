ARG RID=linux-musl-x64
ARG USER=dotnet
ARG DOTNET_VERSION=9.0
ARG UID=1001
ARG PORT=3000

FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
ARG RID

WORKDIR /app
COPY . /app

# Build self-conained
# Doc: https://docs.microsoft.com/en-us/dotnet/core/deploying/
RUN dotnet publish -c Release -r ${RID} /p:PublishSingleFile=true

# Use runtime-deps only container to run self-contained app
FROM mcr.microsoft.com/dotnet/runtime-deps:${DOTNET_VERSION}-alpine
ARG RID
ARG USER
ARG DOTNET_VERSION
ARG UID
ARG PORT
ENV ASPNETCORE_URLS=http://+:${PORT}

WORKDIR /app

RUN apk add tzdata \
 && rm -rf /var/cache/apk/* \
 && adduser \
--disabled-password \
--gecos "" \
--home "$(pwd)" \
--no-create-home \
--uid "${UID}" "${USER}"

# Copy published files
COPY --chown=${UID} --from=build /app/bin/Release/net${DOTNET_VERSION}/${RID}/publish/ .

EXPOSE ${PORT}
USER ${USER}

# Execute app
CMD ["/app/displayRelay"]  
