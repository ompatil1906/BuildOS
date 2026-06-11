import time


def main() -> None:
    print("BuildOS worker started. Background job adapters are ready for queue integration.")
    while True:
        time.sleep(30)


if __name__ == "__main__":
    main()
