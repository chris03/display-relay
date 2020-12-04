ARG RID=linux-musl-x64
ARG RUNTIME_TAG=5.0-alpine
ARG USER=dotnet
ARG UID=1001
ARG PORT=3000

FROM mcr.microsoft.com/dotnet/sdk:5.0-buster-slim AS build
ARG RID

WORKDIR /app
COPY . /app

# Build self-conained
# Doc: https://docs.microsoft.com/en-us/dotnet/core/deploying/
RUN dotnet publish -c Release -r ${RID} /p:PublishSingleFile=true -p:PublishTrimmed=true

# Use runtime-deps only container to run self-contained app
FROM mcr.microsoft.com/dotnet/runtime-deps:${RUNTIME_TAG}
ARG RID
ARG USER
ARG UID
ARG PORT
ENV ASPNETCORE_URLS=http://+:${PORT}

WORKDIR /app

RUN adduser \
--disabled-password \
--gecos "" \
--home "$(pwd)" \
--no-create-home \
--uid "${UID}" "${USER}"

# Copy published files
COPY --chown=${UID} --from=build /app/bin/Release/net5.0/${RID}/publish/ .

EXPOSE ${PORT}
USER ${USER}

# Execute app
CMD ["/app/displayRelay"]  

