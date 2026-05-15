FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["tallyprs-api/TallahasseePRs.Api.csproj", "tallyprs-api/"]
RUN dotnet restore "tallyprs-api/TallahasseePRs.Api.csproj"

COPY . .
WORKDIR "/src/tallyprs-api"
RUN dotnet publish "TallahasseePRs.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "TallahasseePRs.Api.dll"]