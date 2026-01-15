#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n, framesCount;
    cout << "Enter number of pages: ";
    cin >> n;

    vector<int> pages(n);
    cout << "Enter page reference string: ";
    for (int i = 0; i < n; i++) cin >> pages[i];

    cout << "Enter number of frames: ";
    cin >> framesCount;

    vector<int> frames;
    int pageFaults = 0;

    for (int i = 0; i < n; i++) {
        int page = pages[i];
        auto it = find(frames.begin(), frames.end(), page);

        if (it == frames.end()) {
            if (frames.size() < framesCount)
                frames.push_back(page);
            else {
                // Find MRU (Most Recently Used) page
                int mru = -1, maxRecent = -1;
                for (int f : frames) {
                    int pos = -1;
                    for (int j = i - 1; j >= 0; j--) {
                        if (pages[j] == f) { pos = j; break; }
                    }
                    if (pos > maxRecent) {   // The one used most recently
                        maxRecent = pos;
                        mru = f;
                    }
                }

                // Replace MRU page
                int idx = -1;
                for (int j = 0; j < frames.size(); j++) {
                    if (frames[j] == mru) { idx = j; break; }
                }
                frames[idx] = page;
            }
            pageFaults++;
        }

        cout << "Frames: ";
        for (int f : frames) cout << f << " ";
        cout << endl;
    }

    cout << "Total Page Faults = " << pageFaults << endl;
    return 0;
}
