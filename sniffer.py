from scapy.all import sniff

def process_packet(packet):
    try:
        src = packet[0][1].src
        dst = packet[0][1].dst
        proto = packet[0][1].name

        print(f"{src} -> {dst} | {proto}")

    except:
        pass

# capture 20 packets
sniff(prn=process_packet, count=20)