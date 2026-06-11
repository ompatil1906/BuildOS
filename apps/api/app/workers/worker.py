import time


def main() -> None:
    print("BuildOS worker started. Queue execution is placeholder-safe for MVP demo mode.")
    while True:
        time.sleep(30)


if __name__ == "__main__":
    main()

