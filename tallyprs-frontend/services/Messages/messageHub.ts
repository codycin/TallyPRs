import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "@/lib/api";

export function createMessageConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/hubs/messages`, {
      accessTokenFactory: () => {
        return localStorage.getItem("accessToken") ?? "";
      },
    })
    .withAutomaticReconnect()
    .build();
}
